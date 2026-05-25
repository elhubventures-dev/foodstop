'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@chopfast/shared';

export type OrderSummary = {
  id: string;
  status: string;
  customer_name?: string | null;
  customer_email?: string | null;
  item_count?: number | null;
  total: number;
  created_at: string;
};

export const useOrders = () => {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data) {
        setOrders(data);
      }
      setLoading(false);
    };

    fetchOrders();

    // Real-time: use a unique topic per mount. Reusing `channel('realtime_orders')` returns the
    // same client channel; if another subscriber already called `.subscribe()`, adding `.on()`
    // later throws: "cannot add postgres_changes ... after subscribe()".
    const topic =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? `realtime_orders_${crypto.randomUUID()}`
        : `realtime_orders_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(topic)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const order = payload.new as OrderSummary;
          setOrders((current) => [order, ...current]);

          if (Notification.permission === 'granted') {
            new Notification('New Food Order!', {
              body: `Order ${order.id} has just been placed.`,
              icon: '/logo.png',
            });
          }
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  return { orders, loading };
};
