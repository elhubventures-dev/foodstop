import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Share, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function ReferralScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (data) setProfile(data);
    }
    setLoading(false);
  };

  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `Join me on Food Stop! Use my referral code ${profile?.referral_code} to get ₦500 off your first order. Download now: https://foodstop.com/app`,
      });
    } catch (error: any) {
      Alert.alert(error.message);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={Theme.colors.text} />
        </TouchableOpacity>
        <ThemedText type="title">Refer & Earn</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
             <IconSymbol size={48} name="gift.fill" color="white" />
          </View>
          <ThemedText type="subtitle" style={styles.heroTitle}>Give ₦500, Get ₦500</ThemedText>
          <ThemedText style={styles.heroDescription}>
            Invite your friends to Food Stop. When they place their first order, you both earn 500 ChopPoints!
          </ThemedText>
        </View>

        <View style={styles.codeCard}>
          <ThemedText style={styles.codeLabel}>YOUR REFERRAL CODE</ThemedText>
          <View style={styles.codeContainer}>
            <ThemedText style={styles.codeText}>{profile?.referral_code || '------'}</ThemedText>
            <TouchableOpacity onPress={() => Alert.alert('Copied!', 'Referral code copied to clipboard.')}>
              <IconSymbol size={20} name="doc.on.doc" color={Theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
            <ThemedText style={styles.shareBtnText}>Share Invite Link</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.statsSection}>
          <View style={styles.statBox}>
             <ThemedText style={styles.statValue}>{profile?.chop_points || 0}</ThemedText>
             <ThemedText style={styles.statLabel}>ChopPoints</ThemedText>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
             <ThemedText style={styles.statValue}>0</ThemedText>
             <ThemedText style={styles.statLabel}>Friends Joined</ThemedText>
          </View>
        </View>

        <View style={styles.howItWorks}>
           <ThemedText type="subtitle" style={styles.sectionTitle}>How it works</ThemedText>
           {[
             { title: 'Send Invite', desc: 'Share your code with friends' },
             { title: 'They Sign Up', desc: 'Your friend joins Food Stop' },
             { title: 'Both Get Rewarded', desc: 'Receive 500 points on their 1st order' }
           ].map((step, i) => (
             <View key={i} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                   <ThemedText style={styles.stepNumberText}>{i + 1}</ThemedText>
                </View>
                <View>
                   <ThemedText style={styles.stepTitle}>{step.title}</ThemedText>
                   <ThemedText style={styles.stepDesc}>{step.desc}</ThemedText>
                </View>
             </View>
           ))}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: Theme.colors.surface,
  },
  backButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: Theme.colors.primary,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    color: 'white',
    fontSize: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  heroDescription: {
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 14,
  },
  codeCard: {
    backgroundColor: 'white',
    margin: 20,
    marginTop: -30,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 16,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
    gap: 16,
  },
  codeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    letterSpacing: 2,
  },
  shareBtn: {
    backgroundColor: Theme.colors.primary,
    width: '100%',
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  shareBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  howItWorks: {
    padding: 20,
    marginBottom: 40,
  },
  sectionTitle: {
    marginBottom: 20,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  stepDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  }
});

