'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2, MessageSquarePlus, Send } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import { merchantApiGet, merchantApiPatch, merchantApiPost } from '@/lib/merchantApi';

type TicketList = {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
};

type Msg = {
  id: string;
  author_role: string;
  body: string;
  created_at: string;
};

type TicketDetail = TicketList & { messages: Msg[] };

const STATUSES = [
  'open',
  'awaiting_ops',
  'awaiting_merchant',
  'resolved',
  'closed',
] as const;

function SupportTicketsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticketId = searchParams.get('id');
  const { accessToken } = useMerchantAuth();
  const [list, setList] = useState<TicketList[]>([]);
  const [detail, setDetail] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [reply, setReply] = useState('');

  const loadList = useCallback(async () => {
    if (!accessToken) return;
    setErr(null);
    try {
      const data = await merchantApiGet<TicketList[]>('/merchant/support/tickets', accessToken);
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load tickets');
      setList([]);
    }
  }, [accessToken]);

  const loadDetail = useCallback(async () => {
    if (!accessToken || !ticketId) {
      setDetail(null);
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const data = await merchantApiGet<TicketDetail>(
        `/merchant/support/tickets/${ticketId}`,
        accessToken,
      );
      setDetail(data);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load ticket');
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [accessToken, ticketId]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    if (ticketId) {
      void loadDetail();
    } else {
      setDetail(null);
      setLoading(false);
    }
  }, [ticketId, loadDetail]);

  const createTicket = async () => {
    if (!accessToken || !subject.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      const created = await merchantApiPost<{ id?: string } & { messages?: unknown[] }>(
        '/merchant/support/tickets',
        accessToken,
        { subject: subject.trim(), body: body.trim() || undefined },
      );
      setSubject('');
      setBody('');
      await loadList();
      const id = created?.id;
      if (id) {
        router.push(`/merchant/support?id=${encodeURIComponent(id)}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create ticket');
    } finally {
      setBusy(false);
    }
  };

  const sendReply = async () => {
    if (!accessToken || !ticketId || !reply.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await merchantApiPost(`/merchant/support/tickets/${ticketId}/messages`, accessToken, {
        body: reply.trim(),
      });
      setReply('');
      await loadDetail();
      await loadList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: string) => {
    if (!accessToken || !ticketId) return;
    setBusy(true);
    setErr(null);
    try {
      await merchantApiPatch(`/merchant/support/tickets/${ticketId}`, accessToken, { status });
      await loadDetail();
      await loadList();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  if (!accessToken) return null;

  if (ticketId) {
    return (
      <div style={{ padding: '1.5rem 2rem', maxWidth: 720 }}>
        <Link
          href="/merchant/support"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: '0.9rem',
            marginBottom: '1rem',
            color: 'var(--color-primary)',
          }}
        >
          <ArrowLeft size={16} /> All tickets
        </Link>

        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Loader2 size={20} className="spin" /> Loading ticket…
          </div>
        ) : !detail ? (
          <p style={{ color: 'var(--color-error)' }}>{err ?? 'Ticket not found.'}</p>
        ) : (
          <>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '0.35rem' }}>
              {detail.subject}
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              {detail.status.replace(/_/g, ' ')} · priority {detail.priority} · updated{' '}
              {new Date(detail.updated_at).toLocaleString()}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: '1.25rem' }}>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="btn btn-secondary"
                  disabled={busy || detail.status === s}
                  onClick={() => void setStatus(s)}
                  style={{ fontSize: '0.8rem', textTransform: 'capitalize' }}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: '1.25rem' }}>
              {(detail.messages ?? []).map((m) => (
                <div
                  key={m.id}
                  className="card"
                  style={{
                    padding: '0.85rem 1rem',
                    alignSelf: m.author_role === 'merchant' ? 'flex-end' : 'flex-start',
                    maxWidth: '92%',
                    background:
                      m.author_role === 'merchant'
                        ? 'var(--color-bg-secondary, #f0fdf4)'
                        : undefined,
                  }}
                >
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                    {m.author_role === 'merchant' ? 'You' : 'Food Stop ops'} ·{' '}
                    {new Date(m.created_at).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{m.body}</div>
                </div>
              ))}
            </div>

            {err && (
              <p style={{ color: 'var(--color-error)', marginBottom: '0.75rem', fontSize: '0.9rem' }}>{err}</p>
            )}

            <div className="card" style={{ padding: '1rem' }}>
              <label style={{ display: 'block', fontWeight: 600, marginBottom: 8, fontSize: '0.9rem' }}>
                Reply
              </label>
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                placeholder="Describe what you need from support…"
                style={{
                  width: '100%',
                  padding: '0.6rem',
                  borderRadius: 8,
                  border: '1px solid var(--color-border)',
                  marginBottom: 8,
                  fontFamily: 'inherit',
                }}
              />
              <button type="button" className="btn btn-primary" disabled={busy || !reply.trim()} onClick={() => void sendReply()}>
                <Send size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                Send message
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 800 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Support</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem' }}>
        Open a ticket for payouts, verification, or technical issues. The operations team sees the same thread.
      </p>

      {err && list.length === 0 && (
        <p style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{err}</p>
      )}

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <MessageSquarePlus size={18} /> New ticket
        </h2>
        <input
          placeholder="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={{
            width: '100%',
            padding: '0.55rem',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            marginBottom: 8,
          }}
        />
        <textarea
          placeholder="Details (optional)"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          style={{
            width: '100%',
            padding: '0.55rem',
            borderRadius: 8,
            border: '1px solid var(--color-border)',
            marginBottom: 8,
            fontFamily: 'inherit',
          }}
        />
        <button type="button" className="btn btn-primary" disabled={busy || !subject.trim()} onClick={() => void createTicket()}>
          Create ticket
        </button>
      </div>

      <h2 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.65rem' }}>Your tickets</h2>
      {list.length === 0 ? (
        <div className="card" style={{ padding: '1.25rem', color: 'var(--color-text-secondary)' }}>
          No tickets yet.
        </div>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {list.map((t) => (
            <li key={t.id}>
              <Link
                href={`/merchant/support?id=${encodeURIComponent(t.id)}`}
                className="card"
                style={{
                  display: 'block',
                  padding: '0.9rem 1rem',
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <div style={{ fontWeight: 600 }}>{t.subject}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {t.status.replace(/_/g, ' ')} · {new Date(t.updated_at).toLocaleString()}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function MerchantSupportPage() {
  return (
    <React.Suspense
      fallback={
        <div style={{ padding: '2rem', color: 'var(--color-text-secondary)' }}>Loading support…</div>
      }
    >
      <SupportTicketsContent />
    </React.Suspense>
  );
}
