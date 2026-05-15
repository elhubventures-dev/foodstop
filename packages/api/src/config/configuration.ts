export interface CommissionConfig {
  defaultRate: number;
  vatRate: number;
  pendingHoldHours: number;
  disputeHoldHours: number;
}

export interface TermiiConfig {
  apiKey: string;
  baseUrl: string;
  senderId: string;
}

export interface PaystackConfig {
  secretKey: string;
}

export interface MerchantRegistrationConfig {
  /** If set, Cloudinary URLs must live under this cloud name (path validation). */
  cloudinaryCloudName: string;
  /** Dev-only: skip Resend email and accept this 6-digit OTP when RESEND_API_KEY is unset. */
  otpBypassCode: string;
}

export interface WithdrawalConfig {
  minAmountNgn: number;
  adminApprovalThresholdNgn: number;
  /** Dev-only: same pattern as merchant registration OTP bypass. */
  otpBypassCode: string;
}

export interface MerchantAuthConfig {
  jwtSecret: string;
  /** Access token TTL in seconds (default 24h). */
  jwtExpiresSeconds: number;
}

export interface PlatformCommsConfig {
  /** Public customer web origin (no trailing slash), e.g. https://foodstop.com.ng */
  customerWebBaseUrl: string;
  /** Merchant portal base URL for emails; if empty, customer web + /auth/login is suggested. */
  merchantPortalBaseUrl: string;
  name: string;
  supportEmail: string;
  /** Optional https URL to logo image for HTML emails (merchant OTP, etc.). */
  emailLogoUrl: string;
}

export interface SendgridConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface ResendConfig {
  apiKey: string;
  fromEmail: string;
  fromName: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  internalApiKey: string;
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  redis: {
    url: string;
  };
  commission: CommissionConfig;
  termii: TermiiConfig;
  paystack: PaystackConfig;
  merchantRegistration: MerchantRegistrationConfig;
  withdrawal: WithdrawalConfig;
  merchantAuth: MerchantAuthConfig;
  platform: PlatformCommsConfig;
  sendgrid: SendgridConfig;
  resend: ResendConfig;
}

function num(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function cleanEnv(value: string | undefined): string {
  return (value ?? '').trim();
}

function looksLikePlaceholderSupabaseUrl(value: string): boolean {
  return !value || value.includes('your-project.supabase.co');
}

function looksLikePlaceholderServiceRoleKey(value: string): boolean {
  return !value || value === 'eyJ...' || value.length < 20;
}

export const configuration = (): AppConfig => ({
  port: num(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  internalApiKey: process.env.INTERNAL_API_KEY ?? '',
  supabase: {
    url: (() => {
      const preferred = cleanEnv(process.env.SUPABASE_URL);
      const fallback = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
      return looksLikePlaceholderSupabaseUrl(preferred) ? fallback : preferred;
    })(),
    serviceRoleKey: (() => {
      const preferred = cleanEnv(process.env.SUPABASE_SERVICE_ROLE_KEY);
      return looksLikePlaceholderServiceRoleKey(preferred) ? '' : preferred;
    })(),
  },
  redis: {
    url: process.env.REDIS_URL ?? 'redis://localhost:6379',
  },
  commission: {
    defaultRate: num(process.env.DEFAULT_COMMISSION_RATE, 0.15),
    vatRate: num(process.env.VAT_RATE, 0.075),
    pendingHoldHours: num(process.env.PENDING_HOLD_HOURS, 2),
    disputeHoldHours: num(process.env.DISPUTE_HOLD_HOURS, 24),
  },
  termii: {
    apiKey: process.env.TERMII_API_KEY ?? '',
    baseUrl:
      process.env.TERMII_BASE_URL ?? 'https://api.ng.termii.com',
    senderId: process.env.TERMII_SENDER_ID ?? 'FoodStop',
  },
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
  },
  merchantRegistration: {
    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    otpBypassCode: (process.env.MERCHANT_REG_OTP_BYPASS ?? '').trim(),
  },
  withdrawal: {
    minAmountNgn: num(process.env.WITHDRAWAL_MIN_NGN, 1000),
    adminApprovalThresholdNgn: num(process.env.WITHDRAWAL_ADMIN_THRESHOLD_NGN, 500_000),
    otpBypassCode: process.env.MERCHANT_WITHDRAWAL_OTP_BYPASS ?? '',
  },
  merchantAuth: {
    jwtSecret: process.env.MERCHANT_JWT_SECRET ?? '',
    jwtExpiresSeconds: num(process.env.MERCHANT_JWT_EXPIRES_SEC, 86_400),
  },
  platform: {
    customerWebBaseUrl: process.env.CUSTOMER_WEB_BASE_URL ?? '',
    merchantPortalBaseUrl: process.env.MERCHANT_PORTAL_BASE_URL ?? '',
    name: process.env.PLATFORM_NAME ?? 'Food Stop',
    supportEmail: process.env.PLATFORM_SUPPORT_EMAIL ?? '',
    emailLogoUrl: (process.env.PLATFORM_EMAIL_LOGO_URL ?? '').trim(),
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY ?? '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL ?? '',
    fromName: process.env.SENDGRID_FROM_NAME ?? 'Food Stop',
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY ?? '',
    fromEmail: process.env.RESEND_FROM_EMAIL ?? '',
    fromName: process.env.RESEND_FROM_NAME ?? 'Food Stop',
  },
});
