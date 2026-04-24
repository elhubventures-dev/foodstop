'use client';

import { useMemo } from 'react';
import { useOrders } from './useOrders';

export function useStats() {
  const { orders, loading } = useOrders();

  const stats = useMemo(() => {
    if (loading || !orders.length) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Today's Revenue
    const todayOrders = orders.filter(o => new Date(o.created_at) >= today);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

    // Yesterday's Revenue (for trend)
    const yesterdayOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d >= yesterday && d < today;
    });
    const yesterdayRevenue = yesterdayOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    
    const revenueGrowth = yesterdayRevenue === 0 ? 100 : ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;

    // Active Orders
    const activeOrders = orders.filter(o => ['pending', 'preparing', 'ready', 'out_for_delivery'].includes(o.status)).length;

    // Unique Customers
    const uniqueCustomers = new Set(orders.map(o => o.customer_email || o.customer_name)).size;

    return {
      revenue: todayRevenue,
      revenueGrowth: revenueGrowth.toFixed(1),
      activeOrders,
      totalCustomers: uniqueCustomers,
      todayCount: todayOrders.length
    };
  }, [orders, loading]);

  return { stats, loading };
}
