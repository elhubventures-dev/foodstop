'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Loader2,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from './merchantApplicationReview.module.css';

const SLA_HOURS = 48;

async function staffBearer(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('Sign in to the admin app as staff or admin.');
  }
  return session.access_token;
}

async function notifyMerchantApplication(
  merchantId: string,
  event: 'approved' | 'rejected' | 'rfi',
  message?: string,
): Promise<void> {
  const res = await fetch('/api/merchant-applications/notify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      message
        ? { merchant_id: merchantId, event, message }
        : { merchant_id: merchantId, event },
    ),
  });
  const data = (await res.json().catch(() => ({}))) as {
    message?: string | string[];
    error?: string;
  };
  if (!res.ok) {
    const msg = Array.isArray(data.message)
      ? data.message.join('; ')
      : typeof data.message === 'string'
        ? data.message
        : typeof data.error === 'string'
          ? data.error
          : `HTTP ${res.status}`;
    throw new Error(msg);
  }
}

type MerchantRow = {
  id: string;
  business_name: string;
  slug: string;
  business_email: string;
  business_phone: string;
  city: string | null;
  state: string | null;
  category: string | null;
  description: string | null;
  application_reference: string | null;
  application_submitted_at: string | null;
  application_rfi_message: string | null;
  owner_full_name: string | null;
  owner_phone: string | null;
  created_at: string;
};

type DocRow = {
  id: string;
  doc_type: string;
  doc_url: string;
  status: string;
  created_at: string;
};

type BankRow = {
  bank_name: string;
  account_number: string;
  account_name: string;
};

function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);
}

function isPdfUrl(url: string): boolean {
  return /\.pdf(\?|$)/i.test(url);
}

function useSla(submittedAt: string | null) {
  return useMemo(() => {
    const base = submittedAt ? new Date(submittedAt).getTime() : null;
    if (base == null || Number.isNaN(base)) {
      return {
        overdue: false,
        hoursLeft: null as number | null,
        pctElapsed: 0,
        label: 'No submission time',
      };
    }
    const end = base + SLA_HOURS * 3600000;
    const now = Date.now();
    const overdue = now > end;
    const hoursLeft = Math.max(0, (end - now) / 3600000);
    const pctElapsed = Math.min(
      100,
      Math.max(0, ((now - base) / (end - base)) * 100),
    );
    const label = overdue
      ? `${((now - end) / 3600000).toFixed(1)}h over SLA`
      : `${hoursLeft.toFixed(1)}h left (${SLA_HOURS}h SLA)`;
    return { overdue, hoursLeft, pctElapsed, label };
  }, [submittedAt]);
}

export function MerchantApplicationReviewQueue() {
  const [rows, setRows] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [selected, setSelected] = useState<MerchantRow | null>(null);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [bank, setBank] = useState<BankRow | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [activeDoc, setActiveDoc] = useState<DocRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionErr, setActionErr] = useState<string | null>(null);

  const [modal, setModal] = useState<'reject' | 'rfi' | null>(null);
  const [modalNote, setModalNote] = useState('');

  const loadQueue = useCallback(async () => {
    setErr(null);
    try {
      const token = await staffBearer();
      const res = await fetch('/api/super/merchants?scope=pending', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        rows?: MerchantRow[];
        error?: string;
      };
      if (!res.ok) {
        setErr(json.error ?? `HTTP ${res.status}`);
        setRows([]);
      } else {
        setRows(json.rows ?? []);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load queue');
      setRows([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const loadDetail = useCallback(async (m: MerchantRow) => {
    setSelected(m);
    setActiveDoc(null);
    setDocs([]);
    setBank(null);
    setDocsLoading(true);
    setActionErr(null);

    try {
      const token = await staffBearer();
      const res = await fetch(`/api/super/merchants/${encodeURIComponent(m.id)}/review-detail`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as {
        documents?: DocRow[];
        bank?: BankRow | null;
        error?: string;
      };
      if (!res.ok) {
        setActionErr(json.error ?? `HTTP ${res.status}`);
      } else {
        const list = json.documents ?? [];
        setDocs(list);
        setActiveDoc(list[0] ?? null);
        setBank(json.bank ?? null);
      }
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Failed to load KYC');
    }
    setDocsLoading(false);
  }, []);

  const onApprove = async () => {
    if (!selected) return;
    setBusy(true);
    setActionErr(null);
    try {
      const token = await staffBearer();
      const res = await fetch('/api/super/merchant-applications/review', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantId: selected.id, action: 'approve' }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : `HTTP ${res.status}`);
      }

      try {
        await notifyMerchantApplication(selected.id, 'approved');
      } catch (ne) {
        setActionErr(
          ne instanceof Error
            ? `Approved, but email/SMS may have failed: ${ne.message}`
            : 'Approved, but email/SMS may have failed.',
        );
      }

      await loadQueue();
      setSelected(null);
      setDocs([]);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Approve failed');
    } finally {
      setBusy(false);
    }
  };

  const onReject = async () => {
    if (!selected) return;
    const note = modalNote.trim();
    if (note.length < 8) {
      setActionErr('Please enter a clear rejection reason (min 8 characters).');
      return;
    }
    setBusy(true);
    setActionErr(null);
    try {
      const token = await staffBearer();
      const res = await fetch('/api/super/merchant-applications/review', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: selected.id,
          action: 'reject',
          message: note,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : `HTTP ${res.status}`);
      }

      try {
        await notifyMerchantApplication(selected.id, 'rejected', note);
      } catch (ne) {
        setActionErr(
          ne instanceof Error
            ? `Rejected, but email/SMS may have failed: ${ne.message}`
            : 'Rejected, but email/SMS may have failed.',
        );
      }

      setModal(null);
      setModalNote('');
      await loadQueue();
      setSelected(null);
      setDocs([]);
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Reject failed');
    } finally {
      setBusy(false);
    }
  };

  const onRequestInfo = async () => {
    if (!selected) return;
    const note = modalNote.trim();
    if (note.length < 8) {
      setActionErr('Please describe what the merchant should provide (min 8 characters).');
      return;
    }
    setBusy(true);
    setActionErr(null);
    try {
      const token = await staffBearer();
      const res = await fetch('/api/super/merchant-applications/review', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          merchantId: selected.id,
          action: 'rfi',
          message: note,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        throw new Error(typeof json.error === 'string' ? json.error : `HTTP ${res.status}`);
      }

      try {
        await notifyMerchantApplication(selected.id, 'rfi', note);
      } catch (ne) {
        setActionErr(
          ne instanceof Error
            ? `RFI saved, but email/SMS may have failed: ${ne.message}`
            : 'RFI saved, but email/SMS may have failed.',
        );
      }

      setModal(null);
      setModalNote('');
      await loadQueue();
      if (selected) {
        const updated = { ...selected, application_rfi_message: note };
        setSelected(updated);
      }
    } catch (e) {
      setActionErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const sla = useSla(selected?.application_submitted_at ?? null);

  return (
    <div className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>
          <ClipboardList
            size={22}
            style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: 8 }}
          />
          Merchant application queue
        </h1>
        <p className={styles.pageSub}>
          Pending onboarding ({SLA_HOURS}h SLA from submission). Review KYC documents
          inline, then approve, reject, or request more information.
        </p>
      </header>

      {err && (
        <p className={styles.err} style={{ marginBottom: '1rem' }}>
          {err}
        </p>
      )}

      <div className={styles.layout}>
        <div className={styles.queueCard}>
          <div className={styles.queueHead}>
            Pending ({rows.length})
          </div>
          {loading ? (
            <div className={styles.empty}>
              <Loader2 size={24} className={styles.spin} />
            </div>
          ) : rows.length === 0 ? (
            <div className={styles.empty}>No pending merchant applications.</div>
          ) : (
            <div className={styles.queueList}>
              {rows.map((r) => (
                <QueueRowButton
                  key={r.id}
                  row={r}
                  active={selected?.id === r.id}
                  onSelect={() => void loadDetail(r)}
                />
              ))}
            </div>
          )}
        </div>

        <div>
          {!selected ? (
            <div className={styles.detailCard}>
              <p className={styles.empty}>Select an application to review documents and actions.</p>
            </div>
          ) : (
            <div className={styles.detailCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{selected.business_name}</h2>
                  <p style={{ margin: '0.35rem 0 0', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    Ref {selected.application_reference ?? '—'} · {selected.slug}
                  </p>
                </div>
                <div style={{ textAlign: 'right', minWidth: 200 }}>
                  <div className={styles.slaRow}>
                    <Clock size={14} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{sla.label}</span>
                  </div>
                  <div className={styles.slaBar}>
                    <div
                      className={`${styles.slaFill} ${
                        sla.overdue ? styles.slaOver : sla.pctElapsed > 85 ? styles.slaWarn : styles.slaOk
                      }`}
                      style={{ width: `${sla.pctElapsed}%` }}
                    />
                  </div>
                  {selected.application_rfi_message && (
                    <span className={`${styles.badge} ${styles.badgeRfi}`}>RFI pending</span>
                  )}
                </div>
              </div>

              {selected.application_rfi_message && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(59,130,246,0.08)',
                    borderRadius: 8,
                    fontSize: '0.8125rem',
                  }}
                >
                  <strong>Last RFI note:</strong> {selected.application_rfi_message}
                </div>
              )}

              <div className={styles.detailGrid} style={{ marginTop: '1rem' }}>
                <div>
                  <div className={styles.detailLabel}>Business email</div>
                  <div>{selected.business_email}</div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Business phone</div>
                  <div>{selected.business_phone}</div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Owner</div>
                  <div>{selected.owner_full_name ?? '—'}</div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Owner phone</div>
                  <div>{selected.owner_phone ?? '—'}</div>
                </div>
                <div>
                  <div className={styles.detailLabel}>City / State</div>
                  <div>
                    {selected.city ?? '—'}, {selected.state ?? '—'}
                  </div>
                </div>
                <div>
                  <div className={styles.detailLabel}>Category</div>
                  <div>{selected.category ?? '—'}</div>
                </div>
                {bank && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.detailLabel}>Payout account</div>
                    <div>
                      {bank.bank_name} · {bank.account_name} · ****
                      {bank.account_number.slice(-4)}
                    </div>
                  </div>
                )}
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className={styles.detailLabel}>Description</div>
                  <div style={{ lineHeight: 1.45 }}>{selected.description ?? '—'}</div>
                </div>
              </div>

              <h3 style={{ fontSize: '0.85rem', fontWeight: 700, margin: '1rem 0 0.5rem' }}>KYC documents</h3>
              {docsLoading ? (
                <p className={styles.empty}>Loading documents…</p>
              ) : docs.length === 0 ? (
                <p className={styles.empty}>No documents on file.</p>
              ) : (
                <>
                  <div className={styles.docStrip}>
                    {docs.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        className={`${styles.docTab} ${activeDoc?.id === d.id ? styles.docTabActive : ''}`}
                        onClick={() => setActiveDoc(d)}
                      >
                        {d.doc_type} ({d.status})
                      </button>
                    ))}
                  </div>
                  {activeDoc && (
                    <div className={styles.viewer}>
                      <div className={styles.viewerToolbar}>
                        <a href={activeDoc.doc_url} target="_blank" rel="noopener noreferrer">
                          Open in new tab <ExternalLink size={14} style={{ verticalAlign: 'middle' }} />
                        </a>
                      </div>
                      {isImageUrl(activeDoc.doc_url) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={activeDoc.doc_url} alt={activeDoc.doc_type} />
                      ) : isPdfUrl(activeDoc.doc_url) ? (
                        <iframe title={activeDoc.doc_type} src={activeDoc.doc_url} />
                      ) : (
                        <div className={styles.viewerFallback}>
                          <AlertTriangle size={20} style={{ marginBottom: 8 }} />
                          <p>Preview not available for this file type.</p>
                          <p>
                            <a href={activeDoc.doc_url} target="_blank" rel="noopener noreferrer">
                              Open file
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}

              {actionErr && <p className={styles.err}>{actionErr}</p>}

              <div className={styles.actions}>
                <button type="button" className={`${styles.btn} ${styles.btnApprove}`} disabled={busy} onClick={onApprove}>
                  <CheckCircle2 size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
                  Approve & activate
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnRfi}`}
                  disabled={busy}
                  onClick={() => {
                    setModal('rfi');
                    setModalNote('');
                    setActionErr(null);
                  }}
                >
                  Request more info
                </button>
                <button
                  type="button"
                  className={`${styles.btn} ${styles.btnReject}`}
                  disabled={busy}
                  onClick={() => {
                    setModal('reject');
                    setModalNote('');
                    setActionErr(null);
                  }}
                >
                  Reject application
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal === 'reject' && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => !busy && setModal(null)}>
          <div className={styles.modal} role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Reject application</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              The merchant will be suspended and pending documents marked rejected.
            </p>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="Reason shown internally / for audit…"
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => setModal(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnReject}`} disabled={busy} onClick={onReject}>
                {busy ? '…' : 'Confirm reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'rfi' && (
        <div className={styles.modalOverlay} role="presentation" onClick={() => !busy && setModal(null)}>
          <div className={styles.modal} role="dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Request more information</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
              Saves a note on the application. The merchant stays in the queue until you
              approve or reject after they respond (e.g. via email/SMS outside this UI).
            </p>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="What should they upload or clarify?"
            />
            <div className={styles.modalActions}>
              <button type="button" className={styles.btn} onClick={() => setModal(null)} disabled={busy}>
                Cancel
              </button>
              <button type="button" className={`${styles.btn} ${styles.btnRfi}`} disabled={busy} onClick={onRequestInfo}>
                {busy ? '…' : 'Send RFI note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function QueueRowButton({
  row,
  active,
  onSelect,
}: {
  row: MerchantRow;
  active: boolean;
  onSelect: () => void;
}) {
  const sla = useSla(row.application_submitted_at);
  return (
    <button
      type="button"
      className={`${styles.queueRow} ${active ? styles.queueRowActive : ''}`}
      onClick={onSelect}
    >
      <div className={styles.rowTitle}>{row.business_name}</div>
      <div className={styles.rowMeta}>
        {row.city ?? '—'} · {row.application_reference ?? 'no ref'}
      </div>
      <div className={styles.slaRow}>
        <div className={styles.slaBar}>
          <div
            className={`${styles.slaFill} ${
              sla.overdue ? styles.slaOver : sla.pctElapsed > 85 ? styles.slaWarn : styles.slaOk
            }`}
            style={{ width: `${sla.pctElapsed}%` }}
          />
        </div>
      </div>
      <div className={styles.rowMeta}>{sla.label}</div>
      {row.application_rfi_message && (
        <span className={`${styles.badge} ${styles.badgeRfi}`}>RFI</span>
      )}
    </button>
  );
}
