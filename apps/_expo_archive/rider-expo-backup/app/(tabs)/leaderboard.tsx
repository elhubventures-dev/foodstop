import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function LeaderboardScreen() {
  const [riders, setRiders] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any>(null);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7284/ingest/26f413a1-96c6-4f4b-948a-7e5e0bbe3da3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'219acb'},body:JSON.stringify({sessionId:'219acb',runId:'pre-fix-3',hypothesisId:'H2',location:'apps/rider/app/(tabs)/leaderboard.tsx:15',message:'Leaderboard effect started',data:{screen:'leaderboard',iconName:'chevron.right'},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    // Mocking leaderboard data for now
    // In a real app: SELECT profile.name, count(orders.id) as jobs FROM orders JOIN profiles ...
    setRiders([
      { id: '1', name: 'Musa Ibrahim', jobs: 142, rating: 4.9, badge: 'Elite' },
      { id: '2', name: 'Chinelo Okafor', jobs: 128, rating: 4.8, badge: 'Pro' },
      { id: '3', name: 'Babajide Sanwo', jobs: 115, rating: 4.7, badge: 'Pro' },
      { id: '4', name: 'Olumide Peters', jobs: 98, rating: 4.9, badge: 'Top Rated' },
      { id: '5', name: 'Amina Bello', jobs: 84, rating: 4.6, badge: 'Fastest' },
    ]);
    
    setMyStats({ rank: 12, jobs: 45, rating: 4.5, nextBadge: 'Pro' });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Rider Leaderboard</ThemedText>
        <ThemedText style={styles.subtitle}>Top performers this month 🏆</ThemedText>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.myRankCard}>
           <View style={styles.rankInfo}>
              <ThemedText style={styles.rankLabel}>Your Rank</ThemedText>
              <ThemedText style={styles.rankValue}>#{myStats?.rank}</ThemedText>
           </View>
           <View style={styles.divider} />
           <View style={styles.rankInfo}>
              <ThemedText style={styles.rankLabel}>Deliveries</ThemedText>
              <ThemedText style={styles.rankValue}>{myStats?.jobs}</ThemedText>
           </View>
           <View style={styles.divider} />
           <View style={styles.rankInfo}>
              <ThemedText style={styles.rankLabel}>Rating</ThemedText>
              <ThemedText style={styles.rankValue}>⭐ {myStats?.rating}</ThemedText>
           </View>
        </View>

        <View style={styles.badgeSection}>
           <ThemedText type="subtitle" style={styles.sectionTitle}>Your Achievements</ThemedText>
           <View style={styles.badgeContainer}>
              <View style={styles.badge}>
                 <View style={[styles.badgeCircle, { backgroundColor: '#fef3c7' }]}>
                    <IconSymbol size={24} name="bolt.fill" color="#f59e0b" />
                 </View>
                 <ThemedText style={styles.badgeName}>Speedster</ThemedText>
              </View>
              <View style={styles.badge}>
                 <View style={[styles.badgeCircle, { backgroundColor: '#dcfce7' }]}>
                    <IconSymbol size={24} name="hand.thumbsup.fill" color="#10b981" />
                 </View>
                 <ThemedText style={styles.badgeName}>5-Star Rider</ThemedText>
              </View>
              <View style={[styles.badge, { opacity: 0.4 }]}>
                 <View style={[styles.badgeCircle, { backgroundColor: '#e2e8f0' }]}>
                    <IconSymbol size={24} name="lock.fill" color="#64748b" />
                 </View>
                 <ThemedText style={styles.badgeName}>Elite Status</ThemedText>
              </View>
           </View>
        </View>

        <View style={styles.listSection}>
           <ThemedText type="subtitle" style={styles.sectionTitle}>Top Riders (Nigeria)</ThemedText>
           {riders.map((rider, index) => (
             <View key={rider.id} style={styles.riderRow}>
                <ThemedText style={styles.indexText}>{index + 1}</ThemedText>
                <View style={styles.riderInfo}>
                   <ThemedText style={styles.riderName}>{rider.name}</ThemedText>
                   <View style={styles.badgeTag}>
                      <ThemedText style={styles.badgeTagText}>{rider.badge}</ThemedText>
                   </View>
                </View>
                <View style={styles.riderStats}>
                   <ThemedText style={styles.riderJobs}>{rider.jobs} Jobs</ThemedText>
                   <ThemedText style={styles.riderRating}>⭐ {rider.rating}</ThemedText>
                </View>
             </View>
           ))}
        </View>

        <View style={styles.bonusCard}>
           {/* #region agent log */}
           {/* debug render marker for bonus card */}
           {/* #endregion */}
           <IconSymbol size={32} name="gift.fill" color="white" />
           <View style={{ flex: 1, marginLeft: 16 }}>
              <ThemedText style={styles.bonusTitle}>Monthly Bonus Pool</ThemedText>
              <ThemedText style={styles.bonusDesc}>Top 10 riders share ₦250,000 every month!</ThemedText>
           </View>
           <IconSymbol size={20} name="chevron.right" color="white" />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 64,
    paddingBottom: 24,
    backgroundColor: Theme.colors.surface,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  content: {
    padding: 20,
  },
  myRankCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'space-between',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  rankInfo: {
    alignItems: 'center',
    flex: 1,
  },
  rankLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginBottom: 4,
  },
  rankValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#f1f5f9',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  badgeSection: {
    marginBottom: 32,
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  badge: {
    alignItems: 'center',
    flex: 1,
  },
  badgeCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 11,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  listSection: {
    marginBottom: 32,
  },
  riderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  indexText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.textSecondary,
    width: 30,
  },
  riderInfo: {
    flex: 1,
  },
  riderName: {
    fontSize: 15,
    fontWeight: '600',
  },
  badgeTag: {
    backgroundColor: '#fff7ed',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  riderStats: {
    alignItems: 'flex-end',
  },
  riderJobs: {
    fontSize: 14,
    fontWeight: '600',
  },
  riderRating: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  bonusCard: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  bonusTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bonusDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 2,
  }
});


