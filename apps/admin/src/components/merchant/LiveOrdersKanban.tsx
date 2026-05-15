'use client';

/**
 * Merchant Live Orders Kanban — ChopFast multi-vendor skill Phase 3.
 *
 * Socket.io: connects to namespace `/merchant` on NEXT_PUBLIC_MERCHANT_SOCKET_URL.
 * Expected server behaviour (Nest/other): on auth/join, socket joins room `merchant:${merchantId}`
 * and emits `new_order` (full order + items), `order_updated`, and `order_status_update` ({ order }).
 *
 * Fallback: Supabase Realtime on `orders` for the same merchant_id.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import {
  Bell,
  Wifi,
  WifiOff,
  X,
  ChevronRight,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '@chopfast/shared';

import { merchantApiGet, merchantApiPatch } from '@/lib/merchantApi';
import { playNewOrderChime } from './playOrderChime';
import styles from './liveOrdersKanban.module.css';

export type KanbanStatus = 'pending' | 'confirmed' | 'preparing' | 'ready';

const KANBAN_STATUSES: KanbanStatus[] = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
];

const COLUMNS: { id: KanbanStatus; title: string }[] = [
  { id: 'pending', title: 'New' },
  { id: 'confirmed', title: 'Confirmed' },
  { id: 'preparing', title: 'Preparing' },
  { id: 'ready', title: 'Ready' },
];

export interface OrderItemRow {
  id: string;
  name: string;
  price: number | string;
  quantity: number;
  modifiers?: unknown;
}

export interface MerchantOrderRow {
  id: string;
  order_number?: number | null;
  status: string;
  type?: string | null;
  subtotal: number | string;
  delivery_fee?: number | string | null;
  tax?: number | string | null;
  discount?: number | string | null;
  total: number | string;
  merchant_id?: string | null;
  delivery_address?: Record<string, unknown> | null;
  special_instructions?: string | null;
  created_at: string;
  updated_at?: string | null;
  paystack_reference?: string | null;
  order_items?: OrderItemRow[];
}

interface SlideAlert {
  id: string;
  title: string;
  body: string;
  orderId: string;
}

function money(n: number | string | null | undefined): string {
  const v = typeof n === 'number' ? n : Number(n ?? 0);
  return `₦${v.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function mergeOrder(
  prev: MerchantOrderRow[],
  incoming: MerchantOrderRow,
): MerchantOrderRow[] {
  const idx = prev.findIndex((o) => o.id === incoming.id);
  if (idx === -1) return [incoming, ...prev];
  const next = [...prev];
  next[idx] = { ...next[idx], ...incoming };
  return next;
}

export interface LiveOrdersKanbanProps {
  merchantId: string;
  /** When set, uses @chopfast/api + Socket.IO JWT auth instead of Supabase client writes. */
  accessToken?: string | null;
}

export function LiveOrdersKanban({
  merchantId,
  accessToken = null,
}: LiveOrdersKanbanProps) {
  const [orders, setOrders] = useState<MerchantOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [selected, setSelected] = useState<MerchantOrderRow | null>(null);
  const [alert, setAlert] = useState<SlideAlert | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const socketBase =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_MERCHANT_SOCKET_URL ?? ''
      : '';

  const apiBase =
    typeof process !== 'undefined'
      ? (process.env.NEXT_PUBLIC_CHOPFAST_API_URL ?? '').replace(/\/$/, '')
      : '';

  const fetchOrders = useCallback(async () => {
    if (accessToken) {
      try {
        const data = await merchantApiGet<MerchantOrderRow[]>(
          '/merchant/orders?limit=120&expand=items',
          accessToken,
        );
        const list = Array.isArray(data) ? data : [];
        const filtered = list.filter((o) =>
          KANBAN_STATUSES.includes(o.status as KanbanStatus),
        );
        setError(null);
        setOrders(filtered);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load orders');
        setOrders([]);
      }
      setLoading(false);
      return;
    }

    const { data, error: qErr } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('merchant_id', merchantId)
      .in('status', KANBAN_STATUSES)
      .order('created_at', { ascending: false });

    if (qErr) {
      setError(qErr.message);
      setOrders([]);
    } else {
      setError(null);
      setOrders((data as MerchantOrderRow[]) ?? []);
    }
    setLoading(false);
  }, [merchantId, accessToken]);

  useEffect(() => {
    void fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    if (accessToken) return;

    const channel = supabase
      .channel(`merchant-orders-${merchantId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `merchant_id=eq.${merchantId}`,
        },
        () => {
          void fetchOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [merchantId, fetchOrders, accessToken]);

  useEffect(() => {
    const base = accessToken ? apiBase : socketBase.replace(/\/$/, '');
    if (!base) {
      setSocketConnected(false);
      return;
    }

    let socket: Socket | undefined;

    try {
      socket = io(`${base}/merchant`, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 8,
        reconnectionDelay: 1500,
        ...(accessToken ? { auth: { token: accessToken } } : {}),
      });

      socket.on('connect', () => {
        setSocketConnected(true);
        if (!accessToken) {
          socket?.emit('join_merchant', { merchantId });
          socket?.emit('authenticate', { merchantId });
        }
      });

      socket.on('disconnect', () => setSocketConnected(false));
      socket.on('connect_error', () => setSocketConnected(false));

      socket.on(
        'new_order',
        (payload: MerchantOrderRow | { order?: MerchantOrderRow }) => {
          const order =
            'order' in payload && payload.order
              ? payload.order
              : (payload as MerchantOrderRow);
          if (!order?.id || order.merchant_id !== merchantId) return;
          if (!KANBAN_STATUSES.includes(order.status as KanbanStatus)) return;

          setOrders((prev) => mergeOrder(prev, order));
          playNewOrderChime();
          setAlert({
            id: `alert-${order.id}-${Date.now()}`,
            title: 'New order',
            body: `${money(order.total)} · ${order.order_items?.length ?? 0} item(s)`,
            orderId: order.id,
          });
        },
      );

      const onOrderStatusOrUpdate = (
        payload: { order?: MerchantOrderRow } | MerchantOrderRow,
      ) => {
        const order =
          'order' in payload && payload.order
            ? payload.order
            : (payload as MerchantOrderRow);
        if (!order?.id || order.merchant_id !== merchantId) return;
        setOrders((prev) => {
          const others = prev.filter((o) => o.id !== order.id);
          if (!KANBAN_STATUSES.includes(order.status as KanbanStatus)) {
            return others;
          }
          return mergeOrder(others, order);
        });
      };

      socket.on('order_updated', onOrderStatusOrUpdate);
      socket.on('order_status_update', onOrderStatusOrUpdate);
    } catch {
      setSocketConnected(false);
    }

    return () => {
      socket?.disconnect();
    };
  }, [socketBase, apiBase, merchantId, accessToken]);

  const byColumn = useMemo(() => {
    const map: Record<KanbanStatus, MerchantOrderRow[]> = {
      pending: [],
      confirmed: [],
      preparing: [],
      ready: [],
    };
    for (const o of orders) {
      const s = o.status as KanbanStatus;
      if (map[s]) map[s].push(o);
    }
    return map;
  }, [orders]);

  const updateStatus = async (orderId: string, next: string) => {
    setActionLoading(true);
    try {
      if (accessToken) {
        await merchantApiPatch(
          `/merchant/orders/${orderId}/status`,
          accessToken,
          { status: next },
        );
      } else {
        const { error: uErr } = await supabase
          .from('orders')
          .update({ status: next, updated_at: new Date().toISOString() })
          .eq('id', orderId)
          .eq('merchant_id', merchantId);
        if (uErr) {
          setError(uErr.message);
          return;
        }
      }
      await fetchOrders();
      setSelected((cur) =>
        cur?.id === orderId ? { ...cur, status: next } : cur,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openAlertOrder = () => {
    if (!alert) return;
    const o = orders.find((x) => x.id === alert.orderId);
    if (o) setSelected(o);
    setAlert(null);
  };

  return (
    <div>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Live orders</h1>
          <p className={styles.sub}>
            Kanban for active kitchen flow — New through Ready. Socket namespace{' '}
            <code style={{ fontSize: '0.8rem' }}>/merchant</code>
          </p>
        </div>
        <div className={styles.statusPills}>
          <span
            className={`${styles.pill} ${socketConnected ? styles.pillOk : socketBase ? styles.pillWarn : styles.pillErr}`}
          >
            {socketConnected ? (
              <Wifi size={14} />
            ) : (
              <WifiOff size={14} />
            )}
            {accessToken || socketBase
              ? socketConnected
                ? 'Socket connected'
                : 'Socket reconnecting…'
              : 'Socket URL not set'}
          </span>
          {!accessToken && !socketBase && (
            <span className={styles.pill}>
              Using Supabase Realtime as fallback
            </span>
          )}
          {accessToken && !apiBase && (
            <span className={styles.pill}>Set NEXT_PUBLIC_CHOPFAST_API_URL for live socket</span>
          )}
        </div>
      </div>

      {error && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)',
            color: 'var(--color-error)',
            fontSize: '0.875rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertTriangle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Loader2
            size={20}
            style={{ animation: 'spin 0.8s linear infinite' }}
          />{' '}
          Loading orders…
        </div>
      ) : (
        <div className={styles.board}>
          {COLUMNS.map((col) => (
            <div key={col.id} className={styles.column}>
              <div className={styles.columnHeader}>
                <span>{col.title}</span>
                <span className={styles.count}>{byColumn[col.id].length}</span>
              </div>
              <div className={styles.columnBody}>
                {byColumn[col.id].length === 0 ? (
                  <div className={styles.empty}>No orders</div>
                ) : (
                  byColumn[col.id].map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      className={`${styles.card} ${col.id === 'pending' ? styles.cardNew : ''}`}
                      onClick={() => setSelected(order)}
                    >
                      <div className={styles.cardTitle}>
                        #
                        {order.order_number ?? order.id.slice(0, 6).toUpperCase()}
                      </div>
                      <div className={styles.cardMeta}>
                        <span>{money(order.total)}</span>
                        <span>
                          {new Date(order.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {(order.order_items?.length ?? 0) > 0 && (
                          <span>{order.order_items?.length} items</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {alert && (
          <motion.div
            className={styles.alertHost}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          >
            <div className={styles.alert}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <Bell
                  size={20}
                  style={{ color: 'var(--color-primary)', flexShrink: 0 }}
                />
                <div style={{ flex: 1 }}>
                  <div className={styles.alertTitle}>{alert.title}</div>
                  <div className={styles.alertBody}>{alert.body}</div>
                  <div className={styles.alertActions}>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={openAlertOrder}
                    >
                      View order
                    </button>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnGhost}`}
                      onClick={() => setAlert(null)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selected && (
          <>
            <motion.div
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelected(null)}
            />
            <motion.div
              className={styles.panel}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 420, damping: 36 }}
            >
              <div className={styles.panelHeader}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                    Order
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    #
                    {selected.order_number ??
                      selected.id.slice(0, 8).toUpperCase()}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>
                    {selected.status} · {selected.type ?? 'delivery'}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setSelected(null)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  <X size={22} />
                </button>
              </div>

              <div className={styles.panelBody}>
                <div className={styles.sectionTitle}>Totals</div>
                <div className={styles.row}>
                  <span>Subtotal</span>
                  <span>{money(selected.subtotal)}</span>
                </div>
                <div className={styles.row}>
                  <span>Delivery</span>
                  <span>{money(selected.delivery_fee)}</span>
                </div>
                <div className={styles.row}>
                  <span>Tax</span>
                  <span>{money(selected.tax)}</span>
                </div>
                <div
                  className={styles.row}
                  style={{
                    borderBottom: 'none',
                    fontWeight: 700,
                    fontSize: '1rem',
                  }}
                >
                  <span>Total</span>
                  <span>{money(selected.total)}</span>
                </div>

                {selected.delivery_address &&
                  typeof selected.delivery_address === 'object' && (
                  <>
                    <div className={styles.sectionTitle}>Delivery address</div>
                    <p style={{ fontSize: '0.875rem', lineHeight: 1.5 }}>
                      {[
                        (selected.delivery_address as { street?: string }).street,
                        (selected.delivery_address as { city?: string }).city,
                        (selected.delivery_address as { state?: string }).state,
                        (selected.delivery_address as { postal_code?: string }).postal_code,
                      ]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                  </>
                )}

                {selected.special_instructions && (
                  <>
                    <div className={styles.sectionTitle}>Instructions</div>
                    <p style={{ fontSize: '0.875rem' }}>
                      {selected.special_instructions}
                    </p>
                  </>
                )}

                <div className={styles.sectionTitle}>Items</div>
                {(selected.order_items ?? []).length === 0 ? (
                  <p style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                    No line items loaded — refresh or open full order in Admin Orders.
                  </p>
                ) : (
                  (selected.order_items ?? []).map((li) => (
                    <div key={li.id} className={styles.itemRow}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{li.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                          ×{li.quantity}
                        </div>
                      </div>
                      <div>{money(Number(li.price) * li.quantity)}</div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.panelFooter}>
                {selected.status === 'pending' && (
                  <>
                    <button
                      type="button"
                      disabled={actionLoading}
                      className={`${styles.btn} ${styles.btnSuccess} ${styles.btnBlock}`}
                      onClick={() => void updateStatus(selected.id, 'confirmed')}
                    >
                      Accept order
                    </button>
                    <button
                      type="button"
                      disabled={actionLoading}
                      className={`${styles.btn} ${styles.btnDanger} ${styles.btnBlock}`}
                      onClick={() => {
                        if (
                          typeof window !== 'undefined' &&
                          !window.confirm(
                            'Reject this order? It will be marked cancelled.',
                          )
                        ) {
                          return;
                        }
                        void updateStatus(selected.id, 'cancelled');
                        setSelected(null);
                      }}
                    >
                      Reject order
                    </button>
                  </>
                )}
                {selected.status === 'confirmed' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                    onClick={() => void updateStatus(selected.id, 'preparing')}
                  >
                    Start preparing
                    <ChevronRight size={16} style={{ marginLeft: '0.25rem' }} />
                  </button>
                )}
                {selected.status === 'preparing' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                    onClick={() => void updateStatus(selected.id, 'ready')}
                  >
                    Mark ready
                  </button>
                )}
                {selected.status === 'ready' && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    className={`${styles.btn} ${styles.btnPrimary} ${styles.btnBlock}`}
                    onClick={() => void updateStatus(selected.id, 'out_for_delivery')}
                  >
                    Send for delivery
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
