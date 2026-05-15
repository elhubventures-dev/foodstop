import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'crypto';
import Redis from 'ioredis';

import type { AppConfig } from '../config/configuration';
import { SupabaseService } from '../supabase/supabase.service';
import { RegisterMerchantDto } from './dto/register-merchant.dto';
import { assertCloudinaryDocumentUrl } from './utils/cloudinary-url';
import { bankNameForCode, isValidBankCode } from './utils/nigerian-banks';
import {
  isValidNigerianMobile,
} from './utils/nigerian-phone';
import { slugifyBusinessName } from './utils/slugify';
import {
  buildMerchantOtpEmailHtml,
  buildMerchantOtpEmailText,
} from './templates/merchant-otp-email';

export const MERCHANT_OTP_REDIS_PREFIX = 'merchant_reg_otp:';

interface PaystackResolveResult {
  account_name: string;
}

@Injectable()
export class MerchantRegistrationService {
  private readonly logger = new Logger(MerchantRegistrationService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService<AppConfig, true>,
    @Inject('MERCHANT_REDIS') private readonly redis: Redis,
  ) {}

  async requestOwnerOtp(ownerEmailRaw: string): Promise<{
    sent: boolean;
    expiresInSeconds: number;
    /** Normalized email the code was sent to (or dev target). */
    to: string;
    /** Present when Resend is skipped (dev + MERCHANT_REG_OTP_BYPASS only). */
    devBypass?: boolean;
  }> {
    const emailNorm = ownerEmailRaw.trim().toLowerCase();
    if (!emailNorm.includes('@')) {
      throw new BadRequestException('Invalid owner_email format.');
    }

    const resendKey = this.config.get('resend.apiKey', { infer: true })?.trim() ?? '';
    const nodeEnv = this.config.get('nodeEnv', { infer: true });
    const bypass = this.config.get('merchantRegistration.otpBypassCode', {
      infer: true,
    });

    if (!resendKey) {
      if (
        (nodeEnv === 'development' || nodeEnv === 'test') &&
        bypass &&
        bypass.length === 6 &&
        /^\d{6}$/.test(bypass)
      ) {
        this.logger.warn(
          'requestOwnerOtp: RESEND_API_KEY unset — dev session only (use MERCHANT_REG_OTP_BYPASS as the 6-digit OTP; no email).',
        );
        return {
          sent: true,
          expiresInSeconds: 600,
          to: emailNorm,
          devBypass: true,
        };
      }
      throw new ServiceUnavailableException(
        'RESEND_API_KEY is not configured — cannot send OTP. For local dev, set NODE_ENV=development and MERCHANT_REG_OTP_BYPASS to a 6-digit code, then request OTP again.',
      );
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
    await this.sendMerchantRegOtpEmail(emailNorm, code);

    const h = this.hashMerchantRegOtp(emailNorm, code);
    await this.redis.set(
      `${MERCHANT_OTP_REDIS_PREFIX}${emailNorm}`,
      JSON.stringify({ h }),
      'EX',
      600,
    );

    return { sent: true, expiresInSeconds: 600, to: emailNorm };
  }

  async register(dto: RegisterMerchantDto): Promise<{
    merchant_id: string;
    user_id: string;
    application_reference: string;
    slug: string;
  }> {
    const cloudName = this.config.get(
      'merchantRegistration.cloudinaryCloudName',
      { infer: true },
    );

    if (dto.step2.password !== dto.step2.confirm_password) {
      throw new BadRequestException('Password and confirm_password do not match.');
    }

    if (
      !dto.step4.confirm_bank_account ||
      !dto.step4.agree_merchant_agreement ||
      !dto.step4.acknowledge_commission
    ) {
      throw new BadRequestException(
        'Bank confirmation and both agreement checkboxes must be accepted.',
      );
    }

    if (!isValidBankCode(dto.step4.bank_code)) {
      throw new BadRequestException('Unsupported or invalid bank_code.');
    }

    if (!isValidNigerianMobile(dto.step1.business_phone)) {
      throw new BadRequestException('Invalid business_phone format.');
    }
    if (!isValidNigerianMobile(dto.step2.owner_phone)) {
      throw new BadRequestException('Invalid owner_phone format.');
    }

    const docs = dto.step3.documents;
    for (const url of [
      docs.cac,
      docs.owner_id,
      docs.utility_bill,
      docs.nafdac,
      docs.fssai,
    ]) {
      if (url) {
        try {
          assertCloudinaryDocumentUrl(url, cloudName);
        } catch (e) {
          throw new BadRequestException((e as Error).message);
        }
      }
    }

    await this.verifyRegistrationEmailOtp(
      dto.step2.owner_email.trim(),
      dto.step2.otp,
    );

    const resolved = await this.resolvePaystackAccount(
      dto.step4.account_number,
      dto.step4.bank_code,
    );

    if (!resolved.account_name?.trim()) {
      throw new UnprocessableEntityException(
        'Paystack could not resolve account name.',
      );
    }

    const businessEmailTaken = await this.isBusinessEmailTaken(
      dto.step1.business_email,
    );
    if (businessEmailTaken) {
      throw new ConflictException(
        'A merchant application with this business_email already exists.',
      );
    }

    const identityHash = await bcrypt.hash(
      `${dto.step2.nin_bvn_type}:${dto.step2.nin_or_bvn}`,
      12,
    );

    const applicationReference = await this.generateUniqueApplicationReference();
    const slug = await this.generateUniqueSlug(dto.step1.business_name);

    const bankDisplayName =
      bankNameForCode(dto.step4.bank_code) ?? 'Bank';

    const ownerEmailNorm = dto.step2.owner_email.trim().toLowerCase();

    const { data: authUser, error: authErr } =
      await this.supabase.db.auth.admin.createUser({
        email: ownerEmailNorm,
        password: dto.step2.password,
        // Email ownership is already proven via OTP; unconfirmed users often cannot
        // signInWithPassword when "Confirm email" is enabled in Supabase Auth settings.
        email_confirm: true,
        user_metadata: {
          full_name: dto.step2.owner_name,
          registration: 'merchant',
        },
      });

    if (authErr || !authUser.user) {
      if (
        authErr?.message?.includes('already been registered') ||
        authErr?.message?.includes('already registered')
      ) {
        throw new ConflictException(
          'An account with this owner_email already exists.',
        );
      }
      this.logger.error(authErr?.message ?? 'createUser failed');
      throw new UnprocessableEntityException(
        authErr?.message ?? 'Could not create auth user.',
      );
    }

    const userId = authUser.user.id;
    let merchantId: string | undefined;

    try {
      const { error: profileErr } = await this.supabase.db
        .from('profiles')
        .upsert(
          {
            id: userId,
            full_name: dto.step2.owner_name,
            phone: dto.step2.owner_phone.trim(),
            role: 'merchant',
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'id' },
        );

      if (profileErr) {
        throw new Error(profileErr.message);
      }

      const { data: merchantRow, error: merchantErr } = await this.supabase.db
        .from('merchants')
        .insert({
          user_id: userId,
          business_name: dto.step1.business_name.trim(),
          slug,
          business_email: dto.step1.business_email.trim().toLowerCase(),
          business_phone: dto.step1.business_phone.trim(),
          business_address: dto.step1.business_address.trim(),
          city: dto.step1.city,
          state: dto.step1.state.trim(),
          description: dto.step1.description.trim(),
          category: dto.step1.category,
          cuisine_types: dto.step1.cuisine_types,
          number_of_locations: dto.step1.number_of_locations,
          owner_full_name: dto.step2.owner_name.trim(),
          owner_phone: dto.step2.owner_phone.trim(),
          identity_number_hash: identityHash,
          application_reference: applicationReference,
          application_submitted_at: new Date().toISOString(),
          commission_rate: this.config.get('commission.defaultRate', {
            infer: true,
          }),
          is_active: false,
          is_verified: false,
          is_pickup_enabled: true,
        })
        .select('id')
        .single();

      if (merchantErr || !merchantRow) {
        throw new Error(merchantErr?.message ?? 'merchant insert failed');
      }

      merchantId = merchantRow.id as string;

      const docRows = [
        { doc_type: 'CAC' as const, doc_url: docs.cac },
        { doc_type: 'owner_id' as const, doc_url: docs.owner_id },
        { doc_type: 'utility_bill' as const, doc_url: docs.utility_bill },
        ...(docs.nafdac
          ? [{ doc_type: 'NAFDAC' as const, doc_url: docs.nafdac }]
          : []),
        ...(docs.fssai
          ? [{ doc_type: 'FSSAI' as const, doc_url: docs.fssai }]
          : []),
      ];

      const { error: docErr } = await this.supabase.db
        .from('merchant_documents')
        .insert(
          docRows.map((d) => ({
            merchant_id: merchantId,
            doc_type: d.doc_type,
            doc_url: d.doc_url,
            status: 'pending',
          })),
        );

      if (docErr) {
        throw new Error(docErr.message);
      }

      const { error: bankErr } = await this.supabase.db
        .from('merchant_bank_accounts')
        .insert({
          merchant_id: merchantId,
          bank_name: bankDisplayName,
          bank_code: dto.step4.bank_code,
          account_number: dto.step4.account_number,
          account_name: resolved.account_name.trim(),
          is_default: true,
          is_verified: true,
        });

      if (bankErr) {
        throw new Error(bankErr.message);
      }

      return {
        merchant_id: merchantId,
        user_id: userId,
        application_reference: applicationReference,
        slug,
      };
    } catch (err) {
      if (merchantId) {
        await this.supabase.db.from('merchants').delete().eq('id', merchantId);
      }
      await this.supabase.db.auth.admin.deleteUser(userId);
      this.logger.error(`Merchant registration rolled back: ${(err as Error).message}`);
      throw new UnprocessableEntityException(
        (err as Error).message ?? 'Registration failed.',
      );
    }
  }

  private hashMerchantRegOtp(emailNorm: string, otpDigits: string): string {
    const secret =
      this.config.get('internalApiKey', { infer: true })?.trim() ||
      'merchant-reg-otp-dev-pepper';
    return createHmac('sha256', secret)
      .update(`${emailNorm}|${otpDigits}`)
      .digest('hex');
  }

  private async sendMerchantRegOtpEmail(to: string, code: string): Promise<void> {
    const apiKey = this.config.get('resend.apiKey', { infer: true })?.trim() ?? '';
    const fromEmail =
      this.config.get('resend.fromEmail', { infer: true })?.trim() ?? '';
    const fromName = this.config.get('resend.fromName', { infer: true }) ?? 'Food Stop';
    const platformName = this.config.get('platform.name', { infer: true }) ?? 'Food Stop';
    const customerWebBaseUrl = this.config.get('platform.customerWebBaseUrl', {
      infer: true,
    });
    const supportEmail = this.config.get('platform.supportEmail', { infer: true });
    const emailLogoUrl = this.config.get('platform.emailLogoUrl', { infer: true });

    if (!apiKey || !fromEmail) {
      throw new ServiceUnavailableException(
        'RESEND_API_KEY or RESEND_FROM_EMAIL is not configured.',
      );
    }

    const from =
      fromName.trim().length > 0 ? `${fromName.trim()} <${fromEmail}>` : fromEmail;

    const subject = `Your ${platformName} merchant verification code`;
    const emailParams = {
      platformName,
      code,
      customerWebBaseUrl,
      supportEmail,
      emailLogoUrl,
    };
    const html = buildMerchantOtpEmailHtml(emailParams);
    const text = buildMerchantOtpEmailText(emailParams);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject,
        html,
        text,
      }),
    });

    const json = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
      this.logger.error(`Resend merchant OTP failed: ${JSON.stringify(json)}`);
      const msg =
        (typeof json.message === 'string' && json.message) ||
        (Array.isArray(json.errors) ? JSON.stringify(json.errors) : '') ||
        'Failed to send OTP email.';
      throw new UnprocessableEntityException(msg);
    }
  }

  private async verifyRegistrationEmailOtp(
    ownerEmailRaw: string,
    otp: string,
  ): Promise<void> {
    const bypass = this.config.get('merchantRegistration.otpBypassCode', {
      infer: true,
    });
    const nodeEnv = this.config.get('nodeEnv', { infer: true });
    const resendConfigured = Boolean(
      (this.config.get('resend.apiKey', { infer: true }) ?? '').trim(),
    );
    const otpTrim = (otp ?? '').trim();
    const bypassTrim = (bypass ?? '').trim();
    const bypassIsSixDigit = /^\d{6}$/.test(bypassTrim);

    if (bypassIsSixDigit && otpTrim === bypassTrim) {
      if (nodeEnv !== 'development' && nodeEnv !== 'test') {
        throw new BadRequestException(
          `MERCHANT_REG_OTP_BYPASS only works when NODE_ENV is development or test (current: ${String(nodeEnv)}).`,
        );
      }
      this.logger.warn('OTP verified via MERCHANT_REG_OTP_BYPASS (non-production).');
      return;
    }

    const emailNorm = ownerEmailRaw.trim().toLowerCase();
    const raw = await this.redis.get(`${MERCHANT_OTP_REDIS_PREFIX}${emailNorm}`);
    if (!raw) {
      if (!resendConfigured && bypassIsSixDigit) {
        throw new BadRequestException(
          'OTP session missing. With RESEND_API_KEY unset, use the exact 6-digit MERCHANT_REG_OTP_BYPASS from packages/api/.env, ensure NODE_ENV=development, restart the API, then request OTP once before submit.',
        );
      }
      throw new BadRequestException(
        'OTP session expired or missing — request a new code via POST /merchant/register/request-otp.',
      );
    }

    const { h: storedH } = JSON.parse(raw) as { h: string };
    const computed = this.hashMerchantRegOtp(emailNorm, otpTrim);
    const a = Buffer.from(storedH, 'utf8');
    const b = Buffer.from(computed, 'utf8');
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new BadRequestException('Invalid or expired OTP.');
    }

    await this.redis.del(`${MERCHANT_OTP_REDIS_PREFIX}${emailNorm}`);
  }

  private async resolvePaystackAccount(
    accountNumber: string,
    bankCode: string,
  ): Promise<PaystackResolveResult> {
    const secret = this.config.get('paystack.secretKey', { infer: true });
    if (!secret) {
      throw new ServiceUnavailableException(
        'PAYSTACK_SECRET_KEY is not configured — cannot resolve bank account.',
      );
    }

    const url = new URL('https://api.paystack.co/bank/resolve');
    url.searchParams.set('account_number', accountNumber);
    url.searchParams.set('bank_code', bankCode);

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${secret}` },
    });

    const json = (await res.json()) as {
      status?: boolean;
      message?: string;
      data?: PaystackResolveResult;
    };

    if (!res.ok || !json.status || !json.data?.account_name) {
      throw new UnprocessableEntityException(
        json.message ??
          'Paystack could not resolve this account — check bank and account number.',
      );
    }

    return json.data;
  }

  private async isBusinessEmailTaken(email: string): Promise<boolean> {
    const { data } = await this.supabase.db
      .from('merchants')
      .select('id')
      .eq('business_email', email.trim().toLowerCase())
      .maybeSingle();
    return !!data;
  }

  private async generateUniqueApplicationReference(): Promise<string> {
    for (let i = 0; i < 8; i++) {
      const ref = `CF-${randomBytes(4).toString('hex').toUpperCase()}`;
      const { data } = await this.supabase.db
        .from('merchants')
        .select('id')
        .eq('application_reference', ref)
        .maybeSingle();
      if (!data) return ref;
    }
    throw new ServiceUnavailableException('Could not allocate application reference.');
  }

  private async generateUniqueSlug(businessName: string): Promise<string> {
    const base = slugifyBusinessName(businessName);
    for (let i = 0; i < 12; i++) {
      const suffix = i === 0 ? '' : `-${randomBytes(2).toString('hex')}`;
      const candidate = `${base}${suffix}`;
      const { data } = await this.supabase.db
        .from('merchants')
        .select('id')
        .eq('slug', candidate)
        .maybeSingle();
      if (!data) return candidate;
    }
    throw new ServiceUnavailableException('Could not allocate unique slug.');
  }
}
