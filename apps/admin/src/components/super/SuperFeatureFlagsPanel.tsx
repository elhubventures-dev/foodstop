'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@chopfast/shared';
import styles from './growthSafety.module.css';

type Row = {
  flag_key: string;
  enabled: boolean;
  label: string;
  description: string | null;
};

export function SuperFeatureFlagsPanel() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    const { data, error } = await supabase
      .from('platform_feature_flags')
      .select('flag_key, enabled, label, description')
      .order('label', { ascending: true });
    if (error) {
      setErr(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as Row[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async (row: Row) => {
    setBusyKey(row.flag_key);
    setErr(null);
    const { error } = await supabase
      .from('platform_feature_flags')
      .update({ enabled: !row.enabled })
      .eq('flag_key', row.flag_key);
    setBusyKey(null);
    if (error) {
      setErr(error.message);
      return;
    }
    await load();
  };

  return (
    <div className={styles.page}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Feature flags</h1>
          <p className={styles.muted} style={{ marginTop: 6 }}>
            Turn Phase 8 growth &amp; safety modules on for the platform (customer + merchant UIs read these gates).
          </p>
        </div>
        <button type="button" className={styles.btn} onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
          Refresh
        </button>
      </div>
      {err && <p className={styles.err}>{err}</p>}
      {loading ? (
        <p style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Loader2 className="animate-spin" size={20} /> Loading…
        </p>
      ) : (
        <div style={{ overflow: 'auto', border: '1px solid var(--color-border)', borderRadius: 12 }}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>On</th>
                <th>Feature</th>
                <th>Key</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.flag_key}>
                  <td>
                    <input
                      type="checkbox"
                      className={styles.switch}
                      checked={r.enabled}
                      disabled={busyKey === r.flag_key}
                      onChange={() => void toggle(r)}
                      aria-label={`Toggle ${r.label}`}
                    />
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.label}</div>
                    {r.description && <div className={styles.muted}>{r.description}</div>}
                  </td>
                  <td>
                    <code style={{ fontSize: '0.75rem' }}>{r.flag_key}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
