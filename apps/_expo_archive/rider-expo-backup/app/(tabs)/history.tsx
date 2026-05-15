import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function RiderHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const totalEarnings = history.reduce((sum, item) => sum + 1500, 0); // Mock ₦1500 per job

  const fetchHistory = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_id', user.id)
      .eq('status', 'delivered')
      .order('created_at', { ascending: false });

    if (data) setHistory(data);
    setLoading(false);
  };

  const handleCashOut = async () => {
    if (totalEarnings === 0) return;
    setWithdrawing(true);
    
    // Simulate API call to Paystack Payouts
    setTimeout(() => {
      Alert.alert(
        'Payout Requested',
        `₦${totalEarnings.toLocaleString()} will be sent to your registered bank account within 24 hours.`,
        [{ text: 'Great' }]
      );
      setWithdrawing(false);
    }, 2000);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <ThemedText type="subtitle" style={{ color: Theme.colors.primary }}>#{item.id.slice(0, 8)}</ThemedText>
        <ThemedText style={styles.amount}>₦1,500</ThemedText>
      </View>
      
      <ThemedText style={styles.address}>{item.delivery_address}</ThemedText>
      
      <View style={styles.cardFooter}>
        <ThemedText style={styles.date}>
          {new Date(item.created_at).toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
        </ThemedText>
        <View style={styles.successBadge}>
          <IconSymbol size={12} name="checkmark.circle.fill" color={Theme.colors.success} />
          <ThemedText style={styles.successText}>DELIVERED</ThemedText>
        </View>
      </View>
    </View>
  );

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Job History</ThemedText>
        <ThemedText style={styles.subtitle}>You&apos;ve completed {history.length} deliveries.</ThemedText>
      </View>

      <View style={styles.earningsCard}>
        <View>
          <ThemedText style={styles.earningsLabel}>Total Earnings</ThemedText>
          <ThemedText style={styles.earningsAmount}>₦{totalEarnings.toLocaleString()}</ThemedText>
        </View>
        <TouchableOpacity 
          style={[styles.cashOutBtn, withdrawing && { opacity: 0.7 }]} 
          onPress={handleCashOut}
          disabled={withdrawing || totalEarnings === 0}
        >
          <ThemedText style={styles.cashOutText}>{withdrawing ? '...' : 'Cash Out'}</ThemedText>
        </TouchableOpacity>
      </View>

      <FlatList
        data={history}
        renderItem={renderHistoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol size={64} name="clock.arrow.2.circlepath" color="#ccc" />
            <ThemedText style={{ marginTop: 16, color: Theme.colors.textSecondary }}>No past deliveries found.</ThemedText>
          </View>
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 64,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  address: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  date: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  successText: {
    fontSize: 11,
    fontWeight: '700',
    color: Theme.colors.success,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: '#1e293b',
    margin: 20,
    padding: 24,
    borderRadius: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
  },
  earningsLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    marginBottom: 4,
  },
  earningsAmount: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  cashOutBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  cashOutText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  }
});


