import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Theme } from '@/constants/Theme';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [address, setAddress] = useState('');
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
      
      if (data) {
        setProfile(data);
        setAddress(data.delivery_address || '');
      }
    }
    setLoading(false);
  };

  const saveAddress = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('profiles')
      .update({ delivery_address: address })
      .eq('id', user.id);

    if (!error) {
      Alert.alert('Success', 'Address updated successfully!');
    } else {
      Alert.alert('Error', 'Failed to update address.');
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">My Account</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {profile ? (
          <>
            <ThemedView style={styles.section}>
              <View style={styles.profileHeader}>
                 <View style={styles.avatar}>
                    <ThemedText style={styles.avatarText}>{profile.full_name?.charAt(0) || 'U'}</ThemedText>
                 </View>
                 <View>
                    <ThemedText type="subtitle">{profile.full_name || 'Foodie User'}</ThemedText>
                    <ThemedText style={styles.emailText}>Verified Member</ThemedText>
                 </View>
              </View>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>ChopWallet</ThemedText>
              <View style={styles.walletPreview}>
                 <IconSymbol name="creditcard.fill" size={24} color={Theme.colors.primary} />
                 <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={{ fontWeight: '600' }}>Wallet Balance</ThemedText>
                    <ThemedText style={{ fontSize: 18, fontWeight: 'bold', color: Theme.colors.primary }}>
                      ₦{(profile.wallet_balance || 0).toLocaleString()}
                    </ThemedText>
                 </View>
                 <TouchableOpacity 
                   style={styles.walletBtn}
                   onPress={() => router.push('/wallet')}
                 >
                   <ThemedText style={styles.walletBtnText}>Manage</ThemedText>
                 </TouchableOpacity>
              </View>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>Delivery Address</ThemedText>
              <ThemedText style={styles.sectionDescription}>Save your primary delivery location for faster checkout.</ThemedText>
              
              <TextInput
                style={styles.input}
                value={address}
                onChangeText={setAddress}
                placeholder="Enter your street address, city"
                placeholderTextColor="#9ca3af"
              />
              
              <TouchableOpacity style={styles.saveBtn} onPress={saveAddress}>
                <ThemedText style={styles.saveBtnText}>Save Address</ThemedText>
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>ChopRewards</ThemedText>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/referral')}
              >
                 <IconSymbol size={20} name="gift.fill" color={Theme.colors.primary} />
                 <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={styles.menuItemText}>Refer & Earn</ThemedText>
                    <ThemedText style={{ fontSize: 12, color: Theme.colors.textSecondary }}>Get ₦500 for every friend</ThemedText>
                 </View>
                 <IconSymbol size={16} name="chevron.right" color="#ccc" />
              </TouchableOpacity>
            </ThemedView>

            <ThemedView style={styles.section}>
              <ThemedText type="subtitle" style={styles.sectionTitle}>App Settings</ThemedText>
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/support')}
              >
                 <IconSymbol size={20} name="headphones" color={Theme.colors.primary} />
                 <ThemedText style={styles.menuItemText}>Live Support Chat</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                 <IconSymbol size={20} name="bell.fill" color={Theme.colors.primary} />
                 <ThemedText style={styles.menuItemText}>Notifications</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                 <IconSymbol size={20} name="lock.fill" color={Theme.colors.primary} />
                 <ThemedText style={styles.menuItemText}>Privacy & Security</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={handleLogout}>
                 <IconSymbol size={20} name="arrow.left.square.fill" color={Theme.colors.error} />
                 <ThemedText style={[styles.menuItemText, { color: Theme.colors.error }]}>Log Out</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </>
        ) : (
          <ThemedView style={styles.emptyState}>
            <IconSymbol size={64} name="person.crop.circle.badge.exclamationmark" color="#ccc" />
            <ThemedText type="subtitle" style={{ marginTop: 16 }}>Sign in to view profile</ThemedText>
            <TouchableOpacity 
              style={[styles.saveBtn, { marginTop: 20, width: '100%' }]}
              onPress={() => fetchProfile()} // Basic trigger for re-fetch
            >
              <ThemedText style={styles.saveBtnText}>Sign In / Refresh</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}
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
  section: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  sectionTitle: {
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginBottom: 20,
  },
  walletPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  walletBtn: {
    backgroundColor: Theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  walletBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: '700',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  emailText: {
    color: Theme.colors.textSecondary,
    fontSize: 14,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 15,
    fontSize: 15,
    color: Theme.colors.text,
    marginBottom: 15,
  },
  saveBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '500',
  },
  emptyState: {
    marginTop: 100,
    alignItems: 'center',
  }
});
