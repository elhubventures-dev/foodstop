/**
 * Creates a verified demo merchant for local QA (no vendor signup / OTP).
 *
 * Requires in process.env (use packages/api/.env):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Run from repo root:
 *   npm run seed:demo-merchant --workspace=@chopfast/api
 */

import { createClient } from '@supabase/supabase-js';
import * as bcrypt from 'bcrypt';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEMO_EMAIL = 'merchant-demo@foodstop.local';
const DEMO_PASSWORD = 'DemoMerchant123!';
const SLUG = 'demo-merchant';
const BUSINESS_NAME = 'Demo Merchant Kitchen';

function looksLikePlaceholderSupabaseUrl(value: string): boolean {
  return !value || value.includes('your-project.supabase.co');
}

function loadEnvFiles(): void {
  const paths = [
    join(__dirname, '..', '..', '..', 'apps', 'admin', '.env.local'),
    join(__dirname, '..', '..', '..', 'apps', 'web', '.env.local'),
    join(__dirname, '..', '.env'),
  ];
  for (const filePath of paths) {
    if (!existsSync(filePath)) continue;
    const text = readFileSync(filePath, 'utf8');
    for (let line of text.split(/\r?\n/)) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq <= 0) continue;
      const key = line.slice(0, eq).trim();
      let val = line.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}

async function findUserIdByEmail(
  supabase: ReturnType<typeof createClient>,
  email: string,
): Promise<string | null> {
  let page = 1;
  const perPage = 200;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) return null;
    const users = data.users.filter(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (users.length > 0) return users[0].id;
    if (!data.users.length || data.users.length < perPage) break;
    page += 1;
  }
  return null;
}

async function main(): Promise<void> {
  loadEnvFiles();

  const directUrl = (process.env.SUPABASE_URL ?? '').trim();
  const fallbackUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();
  const url = looksLikePlaceholderSupabaseUrl(directUrl)
    ? fallbackUrl
    : directUrl;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
  if (!url || !key) {
    console.error(
      'Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (add to packages/api/.env or apps/admin/.env.local).',
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const publicClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const ownerPhone = '+2348012345678';
  const identityHash = await bcrypt.hash('NIN:12345678901', 12);
  const existingUserId = await findUserIdByEmail(supabase, DEMO_EMAIL);
  let userId = existingUserId;

  if (userId) {
    const { error: updateUserErr } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo Merchant Owner',
          registration: 'merchant',
        },
      },
    );
    if (updateUserErr) {
      console.error('updateUserById failed:', updateUserErr.message);
      process.exit(1);
    }
  } else {
    const { data: created, error: createErr } =
      await supabase.auth.admin.createUser({
        email: DEMO_EMAIL.toLowerCase(),
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: 'Demo Merchant Owner',
          registration: 'merchant',
        },
      });

    if (createErr || !created.user) {
      console.error('createUser failed:', createErr?.message);
      process.exit(1);
    }
    userId = created.user.id;
  }

  if (!userId) {
    console.error('No auth user id available for demo merchant.');
    process.exit(1);
  }

  const { error: profileErr } = await supabase.from('profiles').upsert(
    {
      id: userId,
      full_name: 'Demo Merchant Owner',
      phone: ownerPhone,
      role: 'merchant',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (profileErr) {
    console.error('profiles upsert failed:', profileErr.message);
    process.exit(1);
  }

  const { data: merchantRow, error: mErr } = await supabase
    .from('merchants')
    .upsert(
      {
        user_id: userId,
        business_name: BUSINESS_NAME,
        slug: SLUG,
        business_email: DEMO_EMAIL.toLowerCase(),
        business_phone: ownerPhone,
        business_address: '12 Demo Street, Wuse',
        city: 'Abuja',
        state: 'FCT',
        description:
          'Demo merchant account for testing the partner portal and APIs.',
        category: 'Fast Food',
        cuisine_types: ['Local', 'Grills'],
        number_of_locations: 'one',
        owner_full_name: 'Demo Merchant Owner',
        owner_phone: ownerPhone,
        identity_number_hash: identityHash,
        application_reference: `FS-DEMO-${Date.now().toString(36).toUpperCase()}`,
        application_submitted_at: new Date().toISOString(),
        commission_rate: 0.15,
        is_active: true,
        is_verified: true,
        is_suspended: false,
        is_pickup_enabled: true,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();

  if (mErr || !merchantRow) {
    console.error('merchants insert failed:', mErr?.message);
    process.exit(1);
  }

  const merchantId = merchantRow.id as string;

  // Ensure the login user is linked even if slug upsert updated a stale row.
  await supabase
    .from('merchants')
    .update({
      user_id: userId,
      business_email: DEMO_EMAIL.toLowerCase(),
      is_active: true,
      is_verified: true,
      is_suspended: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', merchantId);

  const signin = await publicClient.auth.signInWithPassword({
    email: DEMO_EMAIL.toLowerCase(),
    password: DEMO_PASSWORD,
  });
  const loginUserId = signin.data.user?.id ?? null;
  const merchantForLogin = loginUserId
    ? await supabase
        .from('merchants')
        .select('id,user_id,slug,business_email,is_active,is_verified')
        .eq('user_id', loginUserId)
        .maybeSingle()
    : null;

  await supabase.from('merchant_wallets').upsert(
    { merchant_id: merchantId },
    { onConflict: 'merchant_id' },
  );

  await supabase.from('merchant_tiers').upsert(
    {
      merchant_id: merchantId,
      tier: 'bronze',
      last_evaluated_at: new Date().toISOString(),
    },
    { onConflict: 'merchant_id' },
  );

  console.log('');
  console.log('Demo merchant created.');
  console.log('  Login URL:     http://localhost:3001/merchant/login  (or your admin app origin)');
  console.log('  API login:     POST /api/v1/merchant/auth/login');
  console.log(`  Email:         ${DEMO_EMAIL}`);
  console.log(`  Password:      ${DEMO_PASSWORD}`);
  console.log(`  Merchant id:   ${merchantId}`);
  console.log(`  Supabase host: ${new URL(url).host}`);
  console.log(`  Login user id: ${loginUserId ?? 'n/a'}`);
  console.log(
    `  Merchant link: ${merchantForLogin?.data ? 'linked' : 'missing'} (lookup by user_id after sign-in)`,
  );
  console.log('');
  console.log(
    'Ensure MERCHANT_JWT_SECRET is set on the API so login returns a token.',
  );
  console.log('');
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
