'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@chopfast/shared';

export const useOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
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

    // 2. Real-time Subscription
    const channel = supabase
      .channel('realtime_orders')
      .on(
        'postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('New Order Received:', payload.new);
          setOrders((current) => [payload.new, ...current]);
          
          // Trigger browser notification
          if (Notification.permission === 'granted') {
            new Notification('New Food Order!', {
              body: `Order ${payload.new.id} has just been placed.`,
              icon: '/logo.png'
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { orders, loading };
};
