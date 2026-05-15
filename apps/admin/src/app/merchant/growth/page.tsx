'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, Sprout } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import {
  merchantApiGet,
  merchantApiGetHtml,
  merchantApiPost,
  merchantApiDelete,
} from '@/lib/merchantApi';
import { supabase, fetchPlatformFeatureFlags, isFeatureOn } from '@chopfast/shared';

type ReferralRow = { id: string; referred_email?: string; status?: string };
type LocationRow = { id: string; name: string };
type VatRow = { id: string; period_start: string; vat_amount_ngn: number; status: string };
type InvoiceRow = { id: string; invoice_number?: string; period_start?: string };
type FeaturedSlotRow = { id: string; slot_type: string; start_date: string; ops_approved?: boolean };
type AudienceRow = { id: string; email?: string };
type CampaignRow = { id: string; subject: string; status: string };

export default function MerchantGrowthPage() {
  const { accessToken } = useMerchantAuth();
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [locName, setLocName] = useState('');
  const [vatRows, setVatRows] = useState<VatRow[]>([]);
  const [vatStart, setVatStart] = useState('');
  const [vatEnd, setVatEnd] = useState('');
  const [vatAmt, setVatAmt] = useState('');
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [slotType, setSlotType] = useState('homepage_hero');
  const [slotStart, setSlotStart] = useState('');
  const [slotEnd, setSlotEnd] = useState('');
  const [slots, setSlots] = useState<FeaturedSlotRow[]>([]);
  const [audienceEmail, setAudienceEmail] = useState('');
  const [audience, setAudience] = useState<AudienceRow[]>([]);
  const [campSubject, setCampSubject] = useState('');
  const [campBody, setCampBody] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [chatMessages, setChatMessages] = useState<{ id: string; author_role: string; body: string; created_at: string }[]>([]);
  const [chatBody, setChatBody] = useState('');

  const loadFlags = useCallback(async () => {
    const f = await fetchPlatformFeatureFlags(supabase);
    setFlags(f);
  }, []);

  const refreshGrowth = useCallback(async () => {
    if (!accessToken) return;
    setErr(null);
    try {
      const f = await fetchPlatformFeatureFlags(supabase);
      setFlags(f);
      if (isFeatureOn(f, 'merchant_referrals')) {
        const r = await merchantApiGet<ReferralRow[]>('/merchant/growth/referrals', accessToken);
        setReferrals(Array.isArray(r) ? r : []);
      } else setReferrals([]);
      if (isFeatureOn(f, 'multi_location_merchant')) {
        const l = await merchantApiGet<LocationRow[]>('/merchant/growth/locations', accessToken);
        setLocations(Array.isArray(l) ? l : []);
      } else setLocations([]);
      if (isFeatureOn(f, 'vat_remittance')) {
        const v = await merchantApiGet<VatRow[]>('/merchant/growth/vat-remittance', accessToken);
        setVatRows(Array.isArray(v) ? v : []);
      } else setVatRows([]);
      if (isFeatureOn(f, 'merchant_invoice_pdf')) {
        const inv = await merchantApiGet<InvoiceRow[]>('/merchant/growth/invoices', accessToken);
        setInvoices(Array.isArray(inv) ? inv : []);
      } else setInvoices([]);
      if (isFeatureOn(f, 'paid_featured_placement')) {
        const s = await merchantApiGet<FeaturedSlotRow[]>('/merchant/growth/featured-slots', accessToken);
        setSlots(Array.isArray(s) ? s : []);
      } else setSlots([]);
      if (isFeatureOn(f, 'merchant_email_marketing')) {
        const [a, c] = await Promise.all([
          merchantApiGet<AudienceRow[]>('/merchant/growth/marketing/audience', accessToken),
          merchantApiGet<CampaignRow[]>('/merchant/growth/marketing/campaigns', accessToken),
        ]);
        setAudience(Array.isArray(a) ? a : []);
        setCampaigns(Array.isArray(c) ? c : []);
      } else {
        setAudience([]);
        setCampaigns([]);
      }
      if (isFeatureOn(f, 'merchant_support_chat')) {
        const ch = await merchantApiGet<
          { id: string; author_role: string; body: string; created_at: string }[]
        >('/merchant/growth/support-chat/messages', accessToken);
        setChatMessages(Array.isArray(ch) ? ch : []);
      } else setChatMessages([]);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load growth tools');
    }
  }, [accessToken]);

  useEffect(() => {
    void loadFlags();
  }, [loadFlags]);

  useEffect(() => {
    if (!accessToken) return;
    let alive = true;
    (async () => {
      setLoading(true);
      await refreshGrowth();
      if (alive) setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [accessToken, refreshGrowth]);

  useEffect(() => {
    if (!accessToken || !isFeatureOn(flags, 'merchant_support_chat')) return;
    const t = setInterval(() => {
      void refreshGrowth();
    }, 8000);
    return () => clearInterval(t);
  }, [accessToken, flags, refreshGrowth]);

  const invite = async () => {
    if (!accessToken || !inviteEmail.trim()) return;
    setMsg(null);
    try {
      await merchantApiPost('/merchant/growth/referrals', accessToken, { email: inviteEmail.trim() });
      setInviteEmail('');
      setMsg('Referral invite recorded.');
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const addLocation = async () => {
    if (!accessToken || !locName.trim()) return;
    try {
      await merchantApiPost('/merchant/growth/locations', accessToken, { name: locName.trim() });
      setLocName('');
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const removeLocation = async (id: string) => {
    if (!accessToken) return;
    try {
      await merchantApiDelete(`/merchant/growth/locations/${id}`, accessToken);
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const recordVat = async () => {
    if (!accessToken || !vatStart || !vatEnd || !vatAmt) return;
    try {
      await merchantApiPost('/merchant/growth/vat-remittance', accessToken, {
        period_start: vatStart,
        period_end: vatEnd,
        vat_amount_ngn: Number(vatAmt),
      });
      setMsg('VAT period recorded.');
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const openInvoiceHtml = async (id: string) => {
    if (!accessToken) return;
    try {
      const html = await merchantApiGetHtml(`/merchant/growth/invoices/${id}/html`, accessToken);
      const w = window.open('', '_blank');
      if (w) {
        w.document.write(html);
        w.document.close();
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const bookSlot = async () => {
    if (!accessToken || !slotStart || !slotEnd) return;
    try {
      await merchantApiPost('/merchant/growth/featured-slots', accessToken, {
        slot_type: slotType,
        start_date: slotStart,
        end_date: slotEnd,
        amount_paid: 0,
      });
      setMsg('Booking submitted — ops must approve before it appears on the homepage.');
      setSlotStart('');
      setSlotEnd('');
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const addAudience = async () => {
    if (!accessToken || !audienceEmail.trim()) return;
    try {
      await merchantApiPost('/merchant/growth/marketing/audience', accessToken, {
        email: audienceEmail.trim(),
      });
      setAudienceEmail('');
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const createCampaign = async () => {
    if (!accessToken || !campSubject.trim() || !campBody.trim()) return;
    try {
      await merchantApiPost('/merchant/growth/marketing/campaigns', accessToken, {
        subject: campSubject.trim(),
        body_plain: campBody,
      });
      setCampSubject('');
      setCampBody('');
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const sendCampaign = async (id: string) => {
    if (!accessToken) return;
    if (typeof window !== 'undefined' && !window.confirm('Send this campaign now? Weekly caps apply per email.')) return;
    try {
      const out = await merchantApiPost<{ sent: number; skipped_cap: number; errors: number }>(
        `/merchant/growth/marketing/campaigns/${id}/send`,
        accessToken,
      );
      setMsg(`Send complete: ${out.sent} sent, ${out.skipped_cap} skipped (cap), ${out.errors} errors.`);
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  const sendChat = async () => {
    if (!accessToken || !chatBody.trim()) return;
    try {
      await merchantApiPost('/merchant/growth/support-chat/messages', accessToken, { body: chatBody.trim() });
      setChatBody('');
      await refreshGrowth();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed');
    }
  };

  if (!accessToken) return null;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 900 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '0.5rem' }}>
        <Sprout size={28} color="var(--color-primary, #16a34a)" />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Growth &amp; safety</h1>
      </div>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem', maxWidth: 640 }}>
        Tools respect{' '}
        <Link href="/super/feature-flags" style={{ fontWeight: 600 }}>
          platform feature flags
        </Link>
        . Ask Food Stop ops to enable a module before it appears here.
      </p>
      <p style={{ fontSize: '0.85rem', marginBottom: '1.25rem' }}>
        Mobile companion (flag <code>merchant_mobile_companion</code>): Expo app in{' '}
        <code>apps/merchant-companion</code> — run <code>npm install</code> then <code>npx expo start</code> from that folder.
      </p>

      {err && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{err}</p>}
      {msg && <p style={{ color: 'var(--color-text-secondary)', marginBottom: '0.75rem' }}>{msg}</p>}

      {loading ? (
        <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="spin" size={20} /> Loading…
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {isFeatureOn(flags, 'merchant_referrals') && (
            <section className="card" style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Referrals</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Track invites; rewards apply when referred merchants are approved.
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
                <input
                  type="email"
                  placeholder="friend@restaurant.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
                <button type="button" className="btn btn-primary" onClick={() => void invite()}>
                  Add invite
                </button>
              </div>
              <ul style={{ fontSize: '0.875rem', paddingLeft: '1.1rem' }}>
                {referrals.length === 0 ? (
                  <li>No referrals yet.</li>
                ) : (
                  referrals.map((r) => (
                    <li key={r.id}>
                      {r.referred_email} — {r.status}
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}

          {isFeatureOn(flags, 'multi_location_merchant') && (
            <section className="card" style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Locations</h2>
              <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
                <input
                  placeholder="Branch name"
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
                <button type="button" className="btn btn-primary" onClick={() => void addLocation()}>
                  Add
                </button>
              </div>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {locations.map((loc) => (
                  <li key={loc.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.35rem 0' }}>
                    <span>{loc.name}</span>
                    <button type="button" className="btn btn-secondary" onClick={() => void removeLocation(loc.id)}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isFeatureOn(flags, 'vat_remittance') && (
            <section className="card" style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>VAT remittance (merchant)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Record periods you remitted VAT (beyond CSV export on the platform side).
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <input type="date" value={vatStart} onChange={(e) => setVatStart(e.target.value)} />
                <input type="date" value={vatEnd} onChange={(e) => setVatEnd(e.target.value)} />
                <input
                  type="number"
                  placeholder="VAT ₦"
                  value={vatAmt}
                  onChange={(e) => setVatAmt(e.target.value)}
                  style={{ width: 120, padding: '0.5rem' }}
                />
                <button type="button" className="btn btn-primary" onClick={() => void recordVat()}>
                  Record
                </button>
              </div>
              <ul style={{ fontSize: '0.85rem' }}>
                {vatRows.map((row) => (
                  <li key={row.id}>
                    {row.period_start} — ₦{Number(row.vat_amount_ngn).toLocaleString('en-NG')} ({row.status})
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isFeatureOn(flags, 'merchant_invoice_pdf') && (
            <section className="card" style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Monthly invoices (HTML / print PDF)</h2>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {invoices.length === 0 ? (
                  <li className="muted">No invoices yet.</li>
                ) : (
                  invoices.map((inv) => (
                    <li key={inv.id} style={{ marginBottom: 8 }}>
                      <button type="button" className="btn btn-secondary" onClick={() => void openInvoiceHtml(inv.id)}>
                        Open {inv.invoice_number ?? inv.id.slice(0, 8)} ({inv.period_start ?? '—'})
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>
          )}

          {isFeatureOn(flags, 'paid_featured_placement') && (
            <section className="card" style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Featured placement (booking)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Request a slot; Food Stop ops approves before it drives the homepage hero when the flag is on.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                <select value={slotType} onChange={(e) => setSlotType(e.target.value)}>
                  <option value="homepage_hero">Homepage hero</option>
                  <option value="category_top">Category top</option>
                  <option value="search_top">Search top</option>
                </select>
                <input type="date" value={slotStart} onChange={(e) => setSlotStart(e.target.value)} />
                <input type="date" value={slotEnd} onChange={(e) => setSlotEnd(e.target.value)} />
                <button type="button" className="btn btn-primary" onClick={() => void bookSlot()}>
                  Request slot
                </button>
              </div>
              <ul style={{ fontSize: '0.8rem' }}>
                {slots.map((s) => (
                  <li key={s.id}>
                    {s.slot_type} {s.start_date} — ops {s.ops_approved ? 'approved' : 'pending'}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isFeatureOn(flags, 'merchant_email_marketing') && (
            <section className="card" style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Email marketing (NDPR opt-in)</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Add opted-in emails only. Sends use SendGrid when configured on the API; otherwise dry-run rows are
                logged. Max 2 emails per recipient per week per merchant (configurable on campaign).
              </p>
              <div style={{ display: 'flex', gap: 8, marginBottom: '0.75rem' }}>
                <input
                  type="email"
                  placeholder="customer@email.com"
                  value={audienceEmail}
                  onChange={(e) => setAudienceEmail(e.target.value)}
                  style={{ flex: 1, padding: '0.5rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
                />
                <button type="button" className="btn btn-primary" onClick={() => void addAudience()}>
                  Add to audience
                </button>
              </div>
              <p style={{ fontSize: '0.8rem' }}>Audience: {audience.length} row(s)</p>
              <h3 style={{ fontSize: '0.95rem' }}>New campaign</h3>
              <input
                placeholder="Subject"
                value={campSubject}
                onChange={(e) => setCampSubject(e.target.value)}
                style={{ width: '100%', marginBottom: 8, padding: '0.5rem' }}
              />
              <textarea
                placeholder="Plain text body (unsubscribe footer is appended automatically)"
                value={campBody}
                onChange={(e) => setCampBody(e.target.value)}
                rows={4}
                style={{ width: '100%', padding: '0.5rem', marginBottom: 8 }}
              />
              <button type="button" className="btn btn-primary" onClick={() => void createCampaign()}>
                Save draft
              </button>
              <ul style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                {campaigns.map((c) => (
                  <li key={c.id} style={{ marginBottom: 6 }}>
                    {c.subject} — {c.status}{' '}
                    {c.status === 'draft' && (
                      <button type="button" className="btn btn-secondary" onClick={() => void sendCampaign(c.id)}>
                        Send now
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {isFeatureOn(flags, 'merchant_support_chat') && (
            <section className="card" style={{ padding: '1rem' }}>
              <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Live chat with ops</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                Complements support tickets. Messages refresh every few seconds while this page is open.
              </p>
              <div
                style={{
                  maxHeight: 240,
                  overflowY: 'auto',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  padding: '0.5rem',
                  marginBottom: 8,
                  fontSize: '0.85rem',
                }}
              >
                {chatMessages.map((m) => (
                  <div key={m.id} style={{ marginBottom: 6 }}>
                    <strong>{m.author_role}</strong> · {new Date(m.created_at).toLocaleString()}
                    <div>{m.body}</div>
                  </div>
                ))}
              </div>
              <textarea
                value={chatBody}
                onChange={(e) => setChatBody(e.target.value)}
                rows={2}
                style={{ width: '100%', padding: '0.5rem' }}
              />
              <button type="button" className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => void sendChat()}>
                Send
              </button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
