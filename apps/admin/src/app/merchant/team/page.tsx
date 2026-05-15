'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Trash2, UserPlus } from 'lucide-react';
import { useMerchantAuth } from '@/context/MerchantAuthContext';
import {
  merchantApiDelete,
  merchantApiGet,
  merchantApiPatch,
  merchantApiPost,
} from '@/lib/merchantApi';

type Role = 'manager' | 'kitchen' | 'cashier';
type Status = 'invited' | 'active' | 'deactivated';

type Member = {
  id: string;
  email: string;
  role: Role;
  status: Status;
  invited_at?: string | null;
};

const ROLES: Role[] = ['manager', 'kitchen', 'cashier'];

export default function MerchantTeamPage() {
  const { accessToken } = useMerchantAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('kitchen');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setErr(null);
    try {
      const data = await merchantApiGet<Member[]>('/merchant/team/members', accessToken);
      setMembers(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load team');
      setMembers([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void load();
  }, [load]);

  const invite = async () => {
    if (!accessToken || !inviteEmail.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await merchantApiPost('/merchant/team/invites', accessToken, {
        email: inviteEmail.trim().toLowerCase(),
        role: inviteRole,
      });
      setInviteEmail('');
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Invite failed');
    } finally {
      setBusy(false);
    }
  };

  const setRole = async (id: string, role: Role) => {
    if (!accessToken) return;
    setBusy(true);
    setErr(null);
    try {
      await merchantApiPatch(`/merchant/team/members/${id}`, accessToken, { role });
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (!accessToken) return;
    if (typeof window !== 'undefined' && !window.confirm('Remove this team member?')) return;
    setBusy(true);
    setErr(null);
    try {
      await merchantApiDelete(`/merchant/team/members/${id}`, accessToken);
      await load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Remove failed');
    } finally {
      setBusy(false);
    }
  };

  if (!accessToken) return null;

  return (
    <div style={{ padding: '1.5rem 2rem', maxWidth: 800 }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.25rem' }}>Team</h1>
      <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.25rem', maxWidth: 560 }}>
        Invite staff with <strong>manager</strong>, <strong>kitchen</strong>, or <strong>cashier</strong> roles.
        Invited users sign in with Food Stop once account linking is enabled; until then this list tracks intended access.
      </p>

      {err && (
        <p style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '0.9rem' }}>{err}</p>
      )}

      <div className="card" style={{ padding: '1rem', marginBottom: '1.25rem' }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <UserPlus size={18} /> Invite
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <input
            type="email"
            placeholder="email@company.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            style={{ flex: '1 1 200px', padding: '0.5rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as Role)}
            style={{ padding: '0.5rem', borderRadius: 8, border: '1px solid var(--color-border)' }}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void invite()}>
            Send invite
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 size={20} className="spin" /> Loading team…
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg-secondary, #f9fafb)', textAlign: 'left' }}>
                <th style={{ padding: '0.65rem 1rem' }}>Email</th>
                <th style={{ padding: '0.65rem 1rem' }}>Role</th>
                <th style={{ padding: '0.65rem 1rem' }}>Status</th>
                <th style={{ padding: '0.65rem 1rem', width: 120 }} />
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '1.25rem', color: 'var(--color-text-secondary)' }}>
                    No team members yet. Invites appear here.
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m.id} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '0.65rem 1rem', fontWeight: 500 }}>{m.email}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <select
                        value={m.role}
                        disabled={busy}
                        onChange={(e) => void setRole(m.id, e.target.value as Role)}
                        style={{ padding: '0.35rem', borderRadius: 6, border: '1px solid var(--color-border)' }}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '0.65rem 1rem', textTransform: 'capitalize' }}>{m.status}</td>
                    <td style={{ padding: '0.65rem 1rem' }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={busy}
                        onClick={() => void remove(m.id)}
                        title="Remove"
                        style={{ padding: '0.35rem 0.5rem' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
