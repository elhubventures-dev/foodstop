'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, MessageSquareReply } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import { merchantApiGet, merchantApiPatch } from '@/lib/merchantApi';

type ReviewRow = {
  id: string;
  order_id: string;
  food_rating: number;
  service_rating: number | null;
  review_text: string | null;
  reply_text: string | null;
  reply_at: string | null;
  created_at: string;
  is_flagged: boolean | null;
};

function Stars({ n }: { n: number }) {
  return (
    <span style={{ letterSpacing: 1 }} aria-label={`${n} of 5 stars`}>
      <span style={{ color: '#ca8a04' }}>
        {'★'.repeat(Math.min(5, Math.max(0, Math.round(n))))}
      </span>
      <span style={{ color: 'var(--color-border)' }}>
        {'★'.repeat(Math.max(0, 5 - Math.round(n)))}
      </span>
    </span>
  );
}

export default function MerchantReviewsPage() {
  const { accessToken, session } = useMerchantAuth();
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);

  const canApi =
    session?.merchant.is_verified === true && session?.merchant.is_active === true;

  const load = useCallback(async () => {
    if (!accessToken || !canApi) {
      setRows([]);
      setLoading(false);
      return;
    }
    setErr(null);
    try {
      const data = await merchantApiGet<ReviewRow[]>('/merchant/reviews', accessToken);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [accessToken, canApi]);

  useEffect(() => {
    void load();
  }, [load]);

  const submitReply = async (id: string) => {
    if (!accessToken || !replyText.trim()) return;
    setSaving(true);
    setErr(null);
    try {
      await merchantApiPatch(`/merchant/reviews/${id}/reply`, accessToken, {
        reply_text: replyText.trim(),
      });
      setReplyId(null);
      setReplyText('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save reply');
    } finally {
      setSaving(false);
    }
  };

  if (!session) return null;

  return (
    <div style={{ padding: '1.5rem 2rem' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Reviews</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }}>
        Customer ratings and public replies (one reply per review).
      </p>
      {!canApi && (
        <p style={{ color: 'var(--color-text-secondary)' }}>Available after your store is verified.</p>
      )}
      {err && <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem' }}>{err}</p>}
      {canApi && loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="spin" size={20} /> Loading…
        </div>
      )}
      {canApi && !loading && rows.length === 0 && (
        <p style={{ color: 'var(--color-text-secondary)' }}>No reviews yet.</p>
      )}
      {canApi && !loading && rows.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {rows.map((r) => (
            <div key={r.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
                <Stars n={r.food_rating} />
                {r.service_rating != null && (
                  <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    Service: <Stars n={r.service_rating} />
                  </span>
                )}
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginLeft: 'auto' }}>
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              {r.is_flagged && (
                <p style={{ fontSize: '0.75rem', color: '#b45309', marginTop: 6 }}>Flagged for moderation</p>
              )}
              {r.review_text && (
                <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', lineHeight: 1.45 }}>{r.review_text}</p>
              )}
              {r.reply_text && (
                <div
                  style={{
                    marginTop: '0.75rem',
                    padding: '0.65rem 0.75rem',
                    background: 'var(--color-bg-secondary, #f1f5f9)',
                    borderRadius: 8,
                    fontSize: '0.875rem',
                  }}
                >
                  <strong>Your reply</strong>
                  {r.reply_at && (
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 400 }}>
                      {' '}
                      · {new Date(r.reply_at).toLocaleString()}
                    </span>
                  )}
                  <div style={{ marginTop: 6 }}>{r.reply_text}</div>
                </div>
              )}
              {replyId === r.id ? (
                <div style={{ marginTop: '0.75rem' }}>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="Write a professional reply…"
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.65rem',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      fontSize: '0.875rem',
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={saving || !replyText.trim()}
                      onClick={() => void submitReply(r.id)}
                    >
                      {saving ? 'Saving…' : 'Publish reply'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyId(null);
                        setReplyText('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                !r.reply_text && (
                  <button
                    type="button"
                    style={{
                      marginTop: '0.65rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: '0.8125rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: 6,
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setReplyId(r.id);
                      setReplyText('');
                    }}
                  >
                    <MessageSquareReply size={14} />
                    Reply
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
