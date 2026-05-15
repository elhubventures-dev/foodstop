import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

import type { AppConfig } from '../config/configuration';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client!: SupabaseClient;

  constructor(private readonly config: ConfigService<AppConfig, true>) {}

  onModuleInit(): void {
    const url = this.config.get('supabase.url', { infer: true });
    const key = this.config.get('supabase.serviceRoleKey', { infer: true });

    if (!url || !key) {
      throw new Error(
        'SupabaseService: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.',
      );
    }

    this.client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { headers: { 'x-chopfast-source': 'api-server' } },
    });

    this.logger.log('Supabase admin client initialised.');
    this.logger.log(`Supabase project host: ${new URL(url).host}`);
  }

  get db(): SupabaseClient {
    return this.client;
  }
}
