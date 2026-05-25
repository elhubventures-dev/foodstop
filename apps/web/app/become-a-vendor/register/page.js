'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { getChopfastApiBaseUrl } from '@/lib/chopfastApi';
import { NIGERIAN_BANKS } from '@/lib/nigerianBanks';
import '../become-a-vendor.css';
import '@/app/auth/auth.css';

const CATEGORIES = [
  'Fast Food',
  'Local Cuisine',
  'Fine Dining',
  'Bakery',
  'Cloud Kitchen',
  'Grills & BBQ',
  'Chinese',
  'Continental',
  'Other',
];

const CITIES = [
  'Lagos',
  'Abuja',
  'Port Harcourt',
  'Kano',
  'Ibadan',
  'Benin City',
  'Enugu',
  'Kaduna',
  'Jos',
  'Warri',
  'Other',
];

const PWD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9\s]).{8,128}$/;

function parseApiError(data) {
  if (!data || typeof data !== 'object') return 'Request failed';
  const m = data.message;
  if (Array.isArray(m)) return m.join(', ');
  if (typeof m === 'string') return m;
  return 'Request failed';
}

function bankLabel(code) {
  const c = String(code ?? '');
  const b = NIGERIAN_BANKS.find((x) => x.code === c);
  return b ? `${b.name} (${c})` : c || '—';
}

function locationsLabel(v) {
  const m = {
    one: 'Just one location',
    two_to_five: '2–5 locations',
    gt_five: 'More than 5 locations',
  };
  return m[v] ?? v ?? '—';
}

function maskAccountTail(acc) {
  const d = String(acc || '').replace(/\D/g, '');
  if (!d.length) return '—';
  if (d.length <= 4) return `••••${d}`;
  return `${'•'.repeat(Math.min(6, d.length - 4))}${d.slice(-4)}`;
}

function maskIdTail(digits) {
  const d = String(digits || '').replace(/\D/g, '');
  if (d.length < 4) return '—';
  return `${'•'.repeat(7)}${d.slice(-4)}`;
}

function truncateUrl(href, max = 52) {
  if (!href) return '';
  return href.length > max ? `${href.slice(0, max - 1)}…` : href;
}

const initialStep1 = {
  business_name: '',
  business_email: '',
  business_phone: '',
  category: 'Fast Food',
  cuisine_raw: '',
  city: 'Abuja',
  state: '',
  business_address: '',
  description: '',
  number_of_locations: 'one',
};

const initialStep2 = {
  owner_name: '',
  owner_phone: '',
  owner_email: '',
  password: '',
  confirm_password: '',
  nin_or_bvn: '',
  nin_bvn_type: 'NIN',
  otp: '',
};

const initialStep3 = {
  cac: '',
  owner_id: '',
  utility_bill: '',
  nafdac: '',
  fssai: '',
};

const initialStep4 = {
  bank_code: '044',
  account_number: '',
  confirm_bank_account: false,
  agree_merchant_agreement: false,
  acknowledge_commission: false,
};

export default function VendorRegisterPage() {
  const apiBase = useMemo(() => getChopfastApiBaseUrl(), []);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [step1, setStep1] = useState(initialStep1);
  const [step2, setStep2] = useState(initialStep2);
  const [step3, setStep3] = useState(initialStep3);
  const [step4, setStep4] = useState(initialStep4);

  const cuisine_types = useMemo(() => {
    const tags = step1.cuisine_raw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return tags.slice(0, 5);
  }, [step1.cuisine_raw]);

  const buildPayload = () => ({
    step1: {
      business_name: step1.business_name.trim(),
      business_email: step1.business_email.trim().toLowerCase(),
      business_phone: step1.business_phone.trim(),
      category: step1.category,
      cuisine_types,
      city: step1.city,
      state: step1.state.trim(),
      business_address: step1.business_address.trim(),
      description: step1.description.trim(),
      number_of_locations: step1.number_of_locations,
    },
    step2: {
      owner_name: step2.owner_name.trim(),
      owner_phone: step2.owner_phone.trim(),
      owner_email: step2.owner_email.trim().toLowerCase(),
      password: step2.password,
      confirm_password: step2.confirm_password,
      nin_or_bvn: step2.nin_or_bvn.replace(/\D/g, '').slice(0, 11),
      nin_bvn_type: step2.nin_bvn_type,
      otp: step2.otp.trim(),
    },
    step3: {
      documents: {
        cac: step3.cac.trim(),
        owner_id: step3.owner_id.trim(),
        utility_bill: step3.utility_bill.trim(),
        ...(step3.nafdac.trim() ? { nafdac: step3.nafdac.trim() } : {}),
        ...(step3.fssai.trim() ? { fssai: step3.fssai.trim() } : {}),
      },
    },
    step4: {
      bank_code: step4.bank_code,
      account_number: step4.account_number.replace(/\D/g, '').slice(0, 10),
      confirm_bank_account: step4.confirm_bank_account,
      agree_merchant_agreement: step4.agree_merchant_agreement,
      acknowledge_commission: step4.acknowledge_commission,
    },
  });

  const reviewPayload = buildPayload();

  const validateStep0 = () => {
    if (step1.business_name.length < 2) {
      toast.error('Business name is required.');
      return false;
    }
    if (cuisine_types.length < 1) {
      toast.error('Add at least one cuisine type (comma-separated).');
      return false;
    }
    if (step1.description.trim().length < 50) {
      toast.error('Description must be at least 50 characters.');
      return false;
    }
    if (step1.state.trim().length < 2) {
      toast.error('State is required.');
      return false;
    }
    return true;
  };

  const validateStep1 = () => {
    if (!PWD_REGEX.test(step2.password)) {
      toast.error(
        'Password: 8+ characters with upper, lower, number, and special character.',
      );
      return false;
    }
    if (step2.password !== step2.confirm_password) {
      toast.error('Passwords do not match.');
      return false;
    }
    if (!/^\d{11}$/.test(step2.nin_or_bvn.replace(/\D/g, ''))) {
      toast.error('NIN/BVN must be exactly 11 digits.');
      return false;
    }
    if (!/^\d{6}$/.test(step2.otp.trim())) {
      toast.error('Enter the 6-digit OTP from your email.');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const https = (u) => /^https:\/\//i.test(u.trim());
    if (!https(step3.cac) || !https(step3.owner_id) || !https(step3.utility_bill)) {
      toast.error('CAC, owner ID, and utility bill must be HTTPS URLs (e.g. Cloudinary).');
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!/^\d{10}$/.test(step4.account_number.replace(/\D/g, ''))) {
      toast.error('Account number must be 10 digits.');
      return false;
    }
    if (
      !step4.confirm_bank_account ||
      !step4.agree_merchant_agreement ||
      !step4.acknowledge_commission
    ) {
      toast.error('Confirm all banking and agreement checkboxes.');
      return false;
    }
    return true;
  };

  const goNext = () => {
    if (step === 0 && !validateStep0()) return;
    if (step === 1 && !validateStep1()) return;
    if (step === 2 && !validateStep2()) return;
    if (step === 3 && !validateStep3()) return;
    setStep((s) => Math.min(s + 1, 4));
  };

  const goBack = () => setStep((s) => Math.max(s - 1, 0));

  const sendOtp = async () => {
    const email = step2.owner_email.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Enter a valid owner email first.');
      return;
    }
    if (!apiBase) {
      toast.error('Set NEXT_PUBLIC_CHOPFAST_API_URL for this environment.');
      return;
    }
    setOtpSending(true);
    try {
      const res = await fetch(`${apiBase}/api/v1/merchant/register/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner_email: email }),
        signal: AbortSignal.timeout(45_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(parseApiError(data));
        return;
      }
      if (data?.devBypass) {
        toast.success(
          'Dev mode: no email. Enter the 6-digit code from MERCHANT_REG_OTP_BYPASS in your API .env (same value for Send OTP + submit).',
          { duration: 8000 },
        );
      } else {
        toast.success(data?.message || 'OTP sent. Check your email inbox (and spam).');
      }
    } catch (e) {
      const msg =
        e?.name === 'TimeoutError' || e?.name === 'AbortError'
          ? 'Request timed out — is the API running? For OTP, Redis must be up on the API host.'
          : e?.message || 'Network error';
      toast.error(msg);
    } finally {
      setOtpSending(false);
    }
  };

  const submit = async () => {
    if (!apiBase) {
      toast.error('Set NEXT_PUBLIC_CHOPFAST_API_URL for this environment.');
      return;
    }
    setSubmitting(true);
    try {
      const body = buildPayload();
      const res = await fetch(`${apiBase}/api/v1/merchant/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(90_000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errText = parseApiError(data);
        if (/OTP session expired or missing/i.test(errText)) {
          toast.error(
            'Email verification session missing or expired. This happens if “Send OTP” never succeeded, Redis was restarted, the owner email changed, or ~10+ minutes passed. Go back to Owner & verification, request a new code, enter it, then submit.',
            { duration: 10_000 },
          );
          setStep(1);
        } else {
          toast.error(errText);
        }
        return;
      }
      toast.success('Application submitted. We will review and contact you.');
      setStep(5);
    } catch (e) {
      const msg =
        e?.name === 'TimeoutError' || e?.name === 'AbortError'
          ? 'Request timed out — check API logs. Registration needs Redis (OTP) and Paystack (bank resolve).'
          : e?.message || 'Network error';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = [
    'Business details',
    'Owner & verification',
    'Documents (URLs)',
    'Banking & agreements',
    'Review & submit',
  ];

  if (step === 5) {
    return (
      <div className="vendor-wizard-wrap">
        <div className="vendor-wizard-card auth-card">
          <h1 className="vendor-wizard-title">Thank you</h1>
          <p className="auth-subtitle" style={{ textAlign: 'left' }}>
            Your vendor application was received. Watch your email for updates. You can sign in at
            the merchant portal once your account is approved.
          </p>
          <div className="vendor-cta-row" style={{ marginTop: '1.5rem' }}>
            <Link href="/" className="vendor-btn-primary">
              Back home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="vendor-wizard-wrap">
      <div className="vendor-wizard-card">
        <h1 className="vendor-wizard-title">Vendor registration</h1>
        <p className="vendor-step-label">
          Step {step + 1} of 5 — {stepTitles[step]}
        </p>

        {step === 0 && (
          <div className="vendor-form-grid two">
            <div className="form-group full">
              <label htmlFor="business_name">Business name</label>
              <input
                id="business_name"
                value={step1.business_name}
                onChange={(e) => setStep1({ ...step1, business_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="business_email">Business email</label>
              <input
                id="business_email"
                type="email"
                value={step1.business_email}
                onChange={(e) => setStep1({ ...step1, business_email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="business_phone">Business phone</label>
              <input
                id="business_phone"
                value={step1.business_phone}
                onChange={(e) => setStep1({ ...step1, business_phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={step1.category}
                onChange={(e) => setStep1({ ...step1, category: e.target.value })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group full">
              <label htmlFor="cuisine_raw">Cuisine types (comma-separated, max 5)</label>
              <input
                id="cuisine_raw"
                value={step1.cuisine_raw}
                onChange={(e) => setStep1({ ...step1, cuisine_raw: e.target.value })}
                placeholder="e.g. Jollof, Suya, Continental"
              />
              <p className="vendor-hint">Parsed: {cuisine_types.join(', ') || '—'}</p>
            </div>
            <div className="form-group">
              <label htmlFor="city">City</label>
              <select
                id="city"
                value={step1.city}
                onChange={(e) => setStep1({ ...step1, city: e.target.value })}
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                id="state"
                value={step1.state}
                onChange={(e) => setStep1({ ...step1, state: e.target.value })}
                required
              />
            </div>
            <div className="form-group full">
              <label htmlFor="business_address">Business address</label>
              <input
                id="business_address"
                value={step1.business_address}
                onChange={(e) => setStep1({ ...step1, business_address: e.target.value })}
                required
              />
            </div>
            <div className="form-group full">
              <label htmlFor="description">Description (min 50 characters)</label>
              <textarea
                id="description"
                value={step1.description}
                onChange={(e) => setStep1({ ...step1, description: e.target.value })}
                required
              />
            </div>
            <div className="form-group full">
              <label>Number of locations</label>
              <div className="vendor-check-row" style={{ marginTop: 8 }}>
                {[
                  { v: 'one', l: 'One' },
                  { v: 'two_to_five', l: '2–5' },
                  { v: 'gt_five', l: 'More than 5' },
                ].map(({ v, l }) => (
                  <label key={v} className="vendor-check-row">
                    <input
                      type="radio"
                      name="number_of_locations"
                      checked={step1.number_of_locations === v}
                      onChange={() => setStep1({ ...step1, number_of_locations: v })}
                    />
                    {l}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="vendor-form-grid two">
            <div className="form-group">
              <label htmlFor="owner_name">Owner full name</label>
              <input
                id="owner_name"
                value={step2.owner_name}
                onChange={(e) => setStep2({ ...step2, owner_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="owner_phone">Owner phone</label>
              <input
                id="owner_phone"
                value={step2.owner_phone}
                onChange={(e) => setStep2({ ...step2, owner_phone: e.target.value })}
                required
              />
            </div>
            <div className="form-group full">
              <label htmlFor="owner_email">Owner email (login)</label>
              <input
                id="owner_email"
                type="email"
                value={step2.owner_email}
                onChange={(e) => setStep2({ ...step2, owner_email: e.target.value })}
                required
              />
            </div>
            <div className="form-group full">
              <div className="vendor-otp-row">
                <div className="form-group">
                  <label htmlFor="otp">6-digit OTP</label>
                  <input
                    id="otp"
                    inputMode="numeric"
                    maxLength={6}
                    value={step2.otp}
                    onChange={(e) =>
                      setStep2({ ...step2, otp: e.target.value.replace(/\D/g, '') })
                    }
                    required
                  />
                </div>
                <button
                  type="button"
                  className="vendor-btn-secondary"
                  onClick={sendOtp}
                  disabled={otpSending}
                >
                  {otpSending ? 'Sending…' : 'Send OTP'}
                </button>
              </div>
              <p className="vendor-hint">
                After entering the owner email (login), tap <strong>Send OTP</strong>. Production
                needs Resend + Redis. Local dev: set <code>NODE_ENV=development</code>, leave{' '}
                <code>RESEND_API_KEY</code> empty, set a 6-digit <code>MERCHANT_REG_OTP_BYPASS</code> in
                the API <code>.env</code>, restart the API — then use that same 6 digits as the OTP.
                Keep the same owner email through submit.
              </p>
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={step2.password}
                onChange={(e) => setStep2({ ...step2, password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm_password">Confirm password</label>
              <input
                id="confirm_password"
                type="password"
                value={step2.confirm_password}
                onChange={(e) => setStep2({ ...step2, confirm_password: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="nin_bvn_type">ID type</label>
              <select
                id="nin_bvn_type"
                value={step2.nin_bvn_type}
                onChange={(e) => setStep2({ ...step2, nin_bvn_type: e.target.value })}
              >
                <option value="NIN">NIN</option>
                <option value="BVN">BVN</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="nin_or_bvn">NIN or BVN (11 digits)</label>
              <input
                id="nin_or_bvn"
                inputMode="numeric"
                maxLength={11}
                value={step2.nin_or_bvn}
                onChange={(e) =>
                  setStep2({ ...step2, nin_or_bvn: e.target.value.replace(/\D/g, '') })
                }
                required
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="vendor-form-grid">
            <p className="vendor-hint full" style={{ marginBottom: 8 }}>
              Upload files to Cloudinary (or your CDN), then paste the HTTPS URLs here.
            </p>
            <div className="form-group">
              <label htmlFor="cac">CAC certificate URL</label>
              <input
                id="cac"
                type="url"
                value={step3.cac}
                onChange={(e) => setStep3({ ...step3, cac: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="owner_id">Owner ID URL</label>
              <input
                id="owner_id"
                type="url"
                value={step3.owner_id}
                onChange={(e) => setStep3({ ...step3, owner_id: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="utility_bill">Utility bill URL</label>
              <input
                id="utility_bill"
                type="url"
                value={step3.utility_bill}
                onChange={(e) => setStep3({ ...step3, utility_bill: e.target.value })}
                placeholder="https://..."
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="nafdac">NAFDAC (optional)</label>
              <input
                id="nafdac"
                type="url"
                value={step3.nafdac}
                onChange={(e) => setStep3({ ...step3, nafdac: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="fssai">FSSAI (optional)</label>
              <input
                id="fssai"
                type="url"
                value={step3.fssai}
                onChange={(e) => setStep3({ ...step3, fssai: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="vendor-form-grid two">
            <div className="form-group full">
              <label htmlFor="bank_code">Bank</label>
              <select
                id="bank_code"
                value={step4.bank_code}
                onChange={(e) => setStep4({ ...step4, bank_code: e.target.value })}
              >
                {NIGERIAN_BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name} ({b.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group full">
              <label htmlFor="account_number">Account number (10 digits)</label>
              <input
                id="account_number"
                inputMode="numeric"
                maxLength={10}
                value={step4.account_number}
                onChange={(e) =>
                  setStep4({ ...step4, account_number: e.target.value.replace(/\D/g, '') })
                }
                required
              />
            </div>
            <div className="form-group full vendor-check-row">
              <input
                id="confirm_bank_account"
                type="checkbox"
                checked={step4.confirm_bank_account}
                onChange={(e) =>
                  setStep4({ ...step4, confirm_bank_account: e.target.checked })
                }
              />
              <label htmlFor="confirm_bank_account">
                I confirm this bank account is correct and owned by the business.
              </label>
            </div>
            <div className="form-group full vendor-check-row">
              <input
                id="agree_merchant_agreement"
                type="checkbox"
                checked={step4.agree_merchant_agreement}
                onChange={(e) =>
                  setStep4({ ...step4, agree_merchant_agreement: e.target.checked })
                }
              />
              <label htmlFor="agree_merchant_agreement">I agree to the merchant agreement.</label>
            </div>
            <div className="form-group full vendor-check-row">
              <input
                id="acknowledge_commission"
                type="checkbox"
                checked={step4.acknowledge_commission}
                onChange={(e) =>
                  setStep4({ ...step4, acknowledge_commission: e.target.checked })
                }
              />
              <label htmlFor="acknowledge_commission">
                I acknowledge platform commission on food sales.
              </label>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="vendor-review-section">
            <div className="vendor-review-card">
              <h3 className="vendor-review-card-title">Business</h3>
              <dl className="vendor-review-dl">
                <div className="vendor-review-row">
                  <dt>Business name</dt>
                  <dd>{reviewPayload.step1.business_name}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Business email</dt>
                  <dd>{reviewPayload.step1.business_email}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Business phone</dt>
                  <dd>{reviewPayload.step1.business_phone}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Category</dt>
                  <dd>{reviewPayload.step1.category}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Cuisine types</dt>
                  <dd>
                    {reviewPayload.step1.cuisine_types?.length ? (
                      <div className="vendor-review-tags">
                        {reviewPayload.step1.cuisine_types.map((t) => (
                          <span key={t} className="vendor-review-tag">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </dd>
                </div>
                <div className="vendor-review-row">
                  <dt>City / state</dt>
                  <dd>
                    {reviewPayload.step1.city}
                    {reviewPayload.step1.state ? ` · ${reviewPayload.step1.state}` : ''}
                  </dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Address</dt>
                  <dd>{reviewPayload.step1.business_address}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Description</dt>
                  <dd>{reviewPayload.step1.description}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Locations</dt>
                  <dd>{locationsLabel(reviewPayload.step1.number_of_locations)}</dd>
                </div>
              </dl>
            </div>

            <div className="vendor-review-card">
              <h3 className="vendor-review-card-title">Owner and verification</h3>
              <dl className="vendor-review-dl">
                <div className="vendor-review-row">
                  <dt>Full name</dt>
                  <dd>{reviewPayload.step2.owner_name}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Phone</dt>
                  <dd>{reviewPayload.step2.owner_phone}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Login email</dt>
                  <dd>{reviewPayload.step2.owner_email}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Password</dt>
                  <dd>••••••••</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>{reviewPayload.step2.nin_bvn_type}</dt>
                  <dd>{maskIdTail(reviewPayload.step2.nin_or_bvn)}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Email OTP</dt>
                  <dd>
                    {reviewPayload.step2.otp?.length === 6 ? '•••••• (entered)' : '—'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="vendor-review-card">
              <h3 className="vendor-review-card-title">Documents</h3>
              <dl className="vendor-review-dl">
                {[
                  ['CAC certificate', reviewPayload.step3.documents.cac],
                  ['Owner ID', reviewPayload.step3.documents.owner_id],
                  ['Utility bill', reviewPayload.step3.documents.utility_bill],
                  ...(reviewPayload.step3.documents.nafdac
                    ? [['NAFDAC', reviewPayload.step3.documents.nafdac]]
                    : []),
                  ...(reviewPayload.step3.documents.fssai
                    ? [['FSSAI', reviewPayload.step3.documents.fssai]]
                    : []),
                ].map(([label, href]) => (
                  <div key={label} className="vendor-review-row">
                    <dt>{label}</dt>
                    <dd>
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vendor-review-link"
                      >
                        {truncateUrl(href)}
                      </a>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="vendor-review-card">
              <h3 className="vendor-review-card-title">Banking and agreements</h3>
              <dl className="vendor-review-dl">
                <div className="vendor-review-row">
                  <dt>Bank</dt>
                  <dd>{bankLabel(reviewPayload.step4.bank_code)}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Account number</dt>
                  <dd>{maskAccountTail(reviewPayload.step4.account_number)}</dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Account confirmed</dt>
                  <dd>
                    <span
                      className={
                        reviewPayload.step4.confirm_bank_account
                          ? 'vendor-review-bool vendor-review-bool--yes'
                          : 'vendor-review-bool vendor-review-bool--no'
                      }
                    >
                      {reviewPayload.step4.confirm_bank_account ? 'Yes' : 'No'}
                    </span>
                  </dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Merchant agreement</dt>
                  <dd>
                    <span
                      className={
                        reviewPayload.step4.agree_merchant_agreement
                          ? 'vendor-review-bool vendor-review-bool--yes'
                          : 'vendor-review-bool vendor-review-bool--no'
                      }
                    >
                      {reviewPayload.step4.agree_merchant_agreement ? 'Accepted' : 'Not accepted'}
                    </span>
                  </dd>
                </div>
                <div className="vendor-review-row">
                  <dt>Commission</dt>
                  <dd>
                    <span
                      className={
                        reviewPayload.step4.acknowledge_commission
                          ? 'vendor-review-bool vendor-review-bool--yes'
                          : 'vendor-review-bool vendor-review-bool--no'
                      }
                    >
                      {reviewPayload.step4.acknowledge_commission ? 'Acknowledged' : 'Not acknowledged'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <p className="vendor-hint">
              API endpoint: {apiBase || '(set NEXT_PUBLIC_CHOPFAST_API_URL)'}
            </p>
          </div>
        )}

        <div className="vendor-wizard-actions">
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {step > 0 && (
              <button type="button" className="vendor-btn-secondary" onClick={goBack}>
                Back
              </button>
            )}
            <Link href="/become-a-vendor" className="vendor-btn-secondary">
              Exit
            </Link>
          </div>
          {step < 4 ? (
            <button type="button" className="vendor-btn-primary" onClick={goNext}>
              Continue
            </button>
          ) : (
            <button
              type="button"
              className="vendor-btn-primary"
              onClick={submit}
              disabled={submitting || !apiBase}
            >
              {submitting ? 'Submitting…' : 'Submit application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
