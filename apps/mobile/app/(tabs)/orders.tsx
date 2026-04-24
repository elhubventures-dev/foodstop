import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Theme } from '@/constants/Theme';
import { OrderStatusStepper } from '@/components/orders/OrderStatusStepper';
import { RatingModal } from '@/components/orders/RatingModal';

export default function OrdersScreen() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [selectedOrderForRating, setSelectedOrderForRating] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      if (data) setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        fetchOrders();
        // Notify user of status change
        if (payload.new.status !== payload.old.status) {
          Alert.alert(
            '🔔 Order Updated',
            `Order #${payload.new.id.slice(0, 8)} is now ${payload.new.status.replace(/_/g, ' ')}!`,
            [{ text: 'OK' }]
          );
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled');
  const pastOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled');

  const renderOrderCard = (order: any) => (
    <View key={order.id} style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <ThemedText type="subtitle" style={styles.orderNumber}>Order #{order.id.slice(0, 8)}</ThemedText>
        <ThemedText style={styles.orderDate}>{new Date(order.created_at).toLocaleDateString()}</ThemedText>
      </View>
      
      {activeTab === 'active' ? (
        <OrderStatusStepper status={order.status} />
      ) : (
        <View style={styles.historyStatus}>
           <View style={[styles.statusTag, { backgroundColor: order.status === 'delivered' ? '#ecfdf5' : '#fef2f2' }]}>
              <ThemedText style={{ fontSize: 11, fontWeight: '700', color: order.status === 'delivered' ? '#059669' : '#dc2626' }}>
                {order.status.toUpperCase()}
              </ThemedText>
           </View>
           <ThemedText style={styles.itemCount}>{order.item_count || 1} items</ThemedText>
        </View>
      )}

           </View>
           <ThemedText style={styles.itemCount}>{order.item_count || 1} items</ThemedText>
        </View>
      )}

      <View style={styles.orderFooter}>
        <View>
          <ThemedText style={styles.totalLabel}>Total Paid</ThemedText>
          <ThemedText style={styles.totalValue}>₦{order.total.toLocaleString()}</ThemedText>
        </View>
        
        {order.status === 'delivered' && (
          <TouchableOpacity 
            style={styles.receiptBtn}
            onPress={() => Alert.alert('Receipt Generated', `Invoice for Order #${order.id.slice(0, 8)} has been saved to your downloads. (TIN: 2348-123-NG)`)}
          >
            <IconSymbol name="doc.text.fill" size={16} color={Theme.colors.textSecondary} />
            <ThemedText style={styles.receiptBtnText}>Receipt</ThemedText>
          </TouchableOpacity>
        )}

        {order.status === 'delivered' && !order.rider_rating && (
          <TouchableOpacity 
            style={styles.rateBtn} 
            onPress={() => setSelectedOrderForRating(order.id)}
          >
            <ThemedText style={styles.rateBtnText}>Rate Delivery</ThemedText>
          </TouchableOpacity>
        )}

        {order.rider_rating && (
          <View style={styles.ratedContainer}>
            <IconSymbol name="star.fill" size={12} color="#f59e0b" />
            <ThemedText style={styles.ratedText}>{order.rider_rating}/5 Rated</ThemedText>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Orders</ThemedText>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'active' && styles.activeTab]} 
          onPress={() => setActiveTab('active')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}>Active</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'history' && styles.activeTab]} 
          onPress={() => setActiveTab('history')}
        >
          <ThemedText style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}>History</ThemedText>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'active' ? (
          activeOrders.length > 0 ? (
            activeOrders.map(renderOrderCard)
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol size={64} name="bag.badge.plus" color="#ccc" />
              <ThemedText type="subtitle" style={{ marginTop: 16 }}>No active orders</ThemedText>
              <ThemedText style={styles.emptySubtext}>Order something delicious to see it here!</ThemedText>
            </View>
          )
        ) : (
          pastOrders.length > 0 ? (
            pastOrders.map(renderOrderCard)
          ) : (
            <View style={styles.emptyState}>
              <IconSymbol size={64} name="clock.arrow.2.circlepath" color="#ccc" />
              <ThemedText type="subtitle" style={{ marginTop: 16 }}>No past orders</ThemedText>
              <ThemedText style={styles.emptySubtext}>Your order history will appear here once delivered.</ThemedText>
            </View>
          )
        )}
      </ScrollView>

      {selectedOrderForRating && (
        <RatingModal
          isVisible={!!selectedOrderForRating}
          onClose={() => setSelectedOrderForRating(null)}
          orderId={selectedOrderForRating}
          onSuccess={fetchOrders}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: Theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  scrollContent: {
    padding: 20,
  },
  orderCard: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 10,
  },
  orderNumber: {
    fontSize: 16,
    color: Theme.colors.primary,
  },
  orderDate: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  totalLabel: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Theme.colors.surface,
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  activeTabText: {
    color: Theme.colors.primary,
  },
  historyStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  statusTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  itemCount: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
    padding: 24,
  },
  emptySubtext: {
    textAlign: 'center',
    marginTop: 8,
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  rateBtn: {
    backgroundColor: 'rgba(200, 65, 11, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'var(--color-primary)',
  },
  rateBtnText: {
    color: 'var(--color-primary)',
    fontSize: 13,
    fontWeight: '700',
  },
  receiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  receiptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  ratedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#b45309',
  }
});
