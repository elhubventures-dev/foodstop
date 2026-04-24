import React, { useEffect, useState } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function RiderDashboard() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    // Fetch orders that are 'ready' for pickup and don't have a rider assigned yet
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'ready')
      .is('rider_id', null)
      .order('created_at', { ascending: false });

    if (data) setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();

    // Set up real-time subscription for new ready orders
    const channel = supabase
      .channel('public:orders')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.new.status === 'ready') {
          fetchJobs();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleClaim = async (orderId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Error', 'You must be logged in to claim jobs.');
      return;
    }

    const { error } = await supabase
      .from('orders')
      .update({ 
        rider_id: user.id, 
        status: 'out_for_delivery',
        updated_at: new Date() 
      })
      .eq('id', orderId)
      .is('rider_id', null); // Ensure no one else claimed it first

    if (!error) {
      Alert.alert('Success', 'Job claimed! Head to the restaurant for pickup.');
      fetchJobs();
    } else {
      Alert.alert('Error', 'Could not claim job. It might have been taken.');
    }
  };

  const renderJobCard = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => {
      Alert.alert(
        'Claim Job?',
        `Do you want to deliver order #${item.id.slice(0, 8)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Claim', onPress: () => handleClaim(item.id) }
        ]
      );
    }}>
      <View style={styles.cardHeader}>
        <ThemedText type="subtitle" style={{ color: Theme.colors.primary }}>#{item.id.slice(0, 8)}</ThemedText>
        <ThemedText style={styles.payout}>₦1,500</ThemedText>
      </View>
      
      <ThemedText style={styles.restaurantName}>Food Stop - Main Hub</ThemedText>
      
      <View style={styles.cardFooter}>
        <View style={styles.meta}>
          <IconSymbol size={16} name="map.fill" color={Theme.colors.textSecondary} />
          <ThemedText style={styles.metaText}>2.5 km away</ThemedText>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: Theme.colors.success + '20' }]}>
          <ThemedText style={{ fontSize: 12, color: Theme.colors.success, fontWeight: 'bold' }}>READY FOR PICKUP</ThemedText>
        </View>
      </View>
    </TouchableOpacity>
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchJobs();
    setRefreshing(false);
  };
  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Available Jobs</ThemedText>
        <View style={styles.onlineStatus}>
          <View style={styles.statusDot} />
          <ThemedText style={{ fontSize: 14, fontWeight: '600' }}>You are Online</ThemedText>
        </View>
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJobCard}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <IconSymbol size={64} name="bicycle" color="#ccc" />
            <ThemedText style={{ marginTop: 16, color: Theme.colors.textSecondary }}>Looking for orders near you...</ThemedText>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Theme.colors.success,
    marginRight: 8,
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
  payout: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  }
});
