import {
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

import type { AppConfig } from '../config/configuration';
import { SupabaseService } from '../supabase/supabase.service';

export interface MerchantLoginResult {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
  merchant: {
    id: string;
    business_name: string;
    is_verified: boolean;
    is_active: boolean;
    is_suspended: boolean;
  };
}

@Injectable()
export class MerchantAuthService {
  private readonly logger = new Logger(MerchantAuthService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  /**
   * Password login for merchants (Supabase Auth user with profiles.role = merchant
   * and a merchants row linked by user_id). Returns ChopFast merchant JWT for
   * Bearer use on /merchant/* APIs (e.g. withdrawals).
   */
  async loginWithPassword(
    email: string,
    password: string,
  ): Promise<MerchantLoginResult> {
    const secret = this.config.get('merchantAuth.jwtSecret', { infer: true });
    if (!secret) {
      throw new ServiceUnavailableException(
        'MERCHANT_JWT_SECRET is not configured — cannot issue merchant tokens.',
      );
    }

    const authUrl = this.config.get('supabase.url', { infer: true });
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
    if (!authUrl || !anonKey) {
      throw new ServiceUnavailableException(
        'NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured — cannot verify merchant password login.',
      );
    }

    // Use a short-lived public auth client so we do NOT mutate the shared
    // admin client session (service-role context is needed for merchant/profile lookups).
    const authClient = createClient(authUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data, error } = await authClient.auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });

    if (error || !data.user) {
      this.logger.debug(`Merchant login failed: ${error?.message ?? 'no user'}`);
      throw new UnauthorizedException('Invalid email or password.');
    }

    const userId = data.user.id;

    const { data: profile, error: pErr } = await this.supabase.db
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();

    if (pErr || !profile || profile.role !== 'merchant') {
      throw new ForbiddenException(
        'This account is not registered as a merchant. Complete vendor onboarding first.',
      );
    }

    const { data: merchant, error: mErr } = await this.supabase.db
      .from('merchants')
      .select('id, business_name, is_verified, is_active, is_suspended')
      .eq('user_id', userId)
      .maybeSingle();

    if (mErr || !merchant) {
      throw new ForbiddenException(
        'No merchant profile is linked to this account yet.',
      );
    }

    const expiresIn = this.config.get('merchantAuth.jwtExpiresSeconds', {
      infer: true,
    });

    const isVerified = merchant.is_verified === true;
    const isActive = merchant.is_active === true;

    const access_token = jwt.sign(
      {
        sub: userId,
        userId,
        merchantId: merchant.id,
        role: 'merchant',
        verified: isVerified,
        active: isActive,
      },
      secret,
      { expiresIn: expiresIn },
    );

    this.logger.log(`Merchant JWT issued for merchant_id=${merchant.id}`);

    return {
      access_token,
      expires_in: expiresIn,
      token_type: 'Bearer',
      merchant: {
        id: merchant.id as string,
        business_name: merchant.business_name as string,
        is_verified: isVerified,
        is_active: isActive,
        is_suspended: merchant.is_suspended === true,
      },
    };
  }
}
