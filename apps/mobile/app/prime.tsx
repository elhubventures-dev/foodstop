import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { Paystack } from 'react-native-paystack-webview';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function PrimeScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [paystackVisible, setPaystackVisible] = useState(false);
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

  const handleSubscribe = () => {
    setPaystackVisible(true);
  };

  const handlePaymentSuccess = async (response: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Set expiry to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const { error } = await supabase
      .from('profiles')
      .update({ 
        subscription_tier: 'prime',
        subscription_expires_at: expiresAt.toISOString()
      })
      .eq('id', user.id);

    if (!error) {
      Alert.alert('Welcome to ChopPrime! 👑', 'You now have unlimited free deliveries for the next 30 days.');
      setPaystackVisible(false);
      fetchProfile();
    } else {
      Alert.alert('Error', 'Failed to activate subscription.');
    }
  };

  const isPrime = profile?.subscription_tier === 'prime';

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
           <View style={styles.primeBadge}>
              <ThemedText style={styles.primeBadgeText}>CHOPPRIME</ThemedText>
           </View>
           <ThemedText style={styles.heroTitle}>Unlimited Free Delivery</ThemedText>
           <ThemedText style={styles.heroPrice}>₦2,500 <ThemedText style={styles.priceSub}>/ month</ThemedText></ThemedText>
        </View>

        <View style={styles.benefitsSection}>
           <ThemedText type="subtitle" style={styles.sectionTitle}>Prime Benefits</ThemedText>
           
           {[
             { icon: 'truck.fill', title: 'Zero Delivery Fees', desc: 'Pay ₦0 on all orders over ₦3,000' },
             { icon: 'star.fill', title: 'Priority Preparation', desc: 'Your orders jump to the front of the queue' },
             { icon: 'tag.fill', title: 'Exclusive Deals', desc: 'Unlock members-only discounts up to 30%' },
             { icon: 'phone.fill', title: 'VIP Support', desc: 'Direct line to our senior support agents' },
           ].map((benefit, i) => (
             <View key={i} style={styles.benefitItem}>
                <View style={styles.benefitIcon}>
                   <IconSymbol size={20} name={benefit.icon} color={Theme.colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                   <ThemedText style={styles.benefitTitle}>{benefit.title}</ThemedText>
                   <ThemedText style={styles.benefitDesc}>{benefit.desc}</ThemedText>
                </View>
             </View>
           ))}
        </View>

        <View style={styles.comparisonBox}>
           <ThemedText style={styles.comparisonTitle}>Why go Prime?</ThemedText>
           <ThemedText style={styles.comparisonText}>
              On average, ChopPrime members save **₦4,500 per month** on delivery fees alone. It pays for itself in just 3 orders!
           </ThemedText>
        </View>
      </ScrollView>

      <View style={styles.footer}>
         {isPrime ? (
           <View style={styles.activePlan}>
              <IconSymbol size={20} name="checkmark.seal.fill" color={Theme.colors.success} />
              <ThemedText style={styles.activePlanText}>
                Active until {new Date(profile.subscription_expires_at).toLocaleDateString()}
              </ThemedText>
           </View>
         ) : (
           <TouchableOpacity style={styles.subscribeBtn} onPress={handleSubscribe}>
              <ThemedText style={styles.subscribeBtnText}>Upgrade Now</ThemedText>
           </TouchableOpacity>
         )}
         <TouchableOpacity onPress={() => router.back()} style={styles.maybeLater}>
            <ThemedText style={styles.maybeLaterText}>Maybe Later</ThemedText>
         </TouchableOpacity>
      </View>

      {paystackVisible && (
        <Paystack  
          paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder"}
          billingEmail="customer@example.com"
          amount={2500}
          onCancel={() => setPaystackVisible(false)}
          onSuccess={handlePaymentSuccess}
          autoStart={true}
          currency="NGN"
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
  scrollContent: {
    paddingBottom: 150,
  },
  heroCard: {
    backgroundColor: '#1e293b',
    padding: 40,
    paddingTop: 80,
    alignItems: 'center',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  primeBadge: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 16,
  },
  primeBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1,
  },
  heroTitle: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  heroPrice: {
    color: 'white',
    fontSize: 32,
    fontWeight: 'bold',
  },
  priceSub: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: 'normal',
  },
  benefitsSection: {
    padding: 24,
  },
  sectionTitle: {
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  benefitIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  benefitDesc: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginTop: 2,
  },
  comparisonBox: {
    backgroundColor: '#f8fafc',
    margin: 24,
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  comparisonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  comparisonText: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    paddingBottom: 40,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  subscribeBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  activePlan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    backgroundColor: '#ecfdf5',
    borderRadius: 16,
  },
  activePlanText: {
    color: '#065f46',
    fontWeight: 'bold',
  },
  maybeLater: {
    alignItems: 'center',
    marginTop: 16,
  },
  maybeLaterText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  }
});
