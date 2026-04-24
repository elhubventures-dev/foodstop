import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Paystack } from 'react-native-paystack-webview';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

export default function WalletScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [paystackVisible, setPaystackVisible] = useState(false);
  const [transactions, setTransactions] = useState<any[]>([]);

  const fetchWalletData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch profile for balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single();
    
    if (profile) setBalance(profile.wallet_balance || 0);

    // Fetch transactions (mocked for now since table might not exist yet)
    // In a real app: const { data: txs } = await supabase.from('wallet_transactions')...
    setTransactions([
      { id: '1', type: 'top_up', amount: 5000, status: 'success', created_at: new Date().toISOString() },
      { id: '2', type: 'payment', amount: -1200, status: 'success', created_at: new Date(Date.now() - 86400000).toISOString() },
    ]);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleTopUp = () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount < 100) {
      Alert.alert('Invalid Amount', 'Please enter at least ₦100');
      return;
    }
    setPaystackVisible(true);
  };

  const handlePaymentSuccess = async (response: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const amount = parseFloat(topUpAmount);

    // Update wallet balance
    const { error } = await supabase
      .from('profiles')
      .update({ wallet_balance: balance + amount })
      .eq('id', user.id);

    if (!error) {
      Alert.alert('Top-up Successful', `₦${amount.toLocaleString()} has been added to your ChopWallet.`);
      setTopUpAmount('');
      setPaystackVisible(false);
      fetchWalletData();
    } else {
      Alert.alert('Error', 'Failed to update balance. Please contact support.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={Theme.colors.text} />
        </TouchableOpacity>
        <ThemedText type="title">ChopWallet</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.balanceCard}>
          <ThemedText style={styles.balanceLabel}>Available Balance</ThemedText>
          <ThemedText style={styles.balanceAmount}>₦{balance.toLocaleString()}</ThemedText>
        </View>

        <View style={styles.topUpSection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Top Up Wallet</ThemedText>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.currencyPrefix}>₦</ThemedText>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              keyboardType="numeric"
              value={topUpAmount}
              onChangeText={setTopUpAmount}
            />
          </View>
          
          <View style={styles.quickAmounts}>
            {[1000, 2000, 5000, 10000].map((amt) => (
              <TouchableOpacity 
                key={amt} 
                style={styles.quickBtn}
                onPress={() => setTopUpAmount(amt.toString())}
              >
                <ThemedText style={styles.quickBtnText}>+₦{amt.toLocaleString()}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.topUpBtn} onPress={handleTopUp}>
            <ThemedText style={styles.topUpBtnText}>Add Funds</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.historySection}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Transaction History</ThemedText>
          {transactions.map((tx) => (
            <View key={tx.id} style={styles.txItem}>
              <View style={[styles.txIcon, { backgroundColor: tx.type === 'top_up' ? '#ecfdf5' : '#fef2f2' }]}>
                <IconSymbol 
                  size={20} 
                  name={tx.type === 'top_up' ? 'arrow.down.left' : 'arrow.up.right'} 
                  color={tx.type === 'top_up' ? '#059669' : '#dc2626'} 
                />
              </View>
              <View style={styles.txInfo}>
                <ThemedText style={styles.txType}>{tx.type === 'top_up' ? 'Wallet Top-up' : 'Food Payment'}</ThemedText>
                <ThemedText style={styles.txDate}>{new Date(tx.created_at).toLocaleDateString()}</ThemedText>
              </View>
              <ThemedText style={[styles.txAmount, { color: tx.type === 'top_up' ? '#059669' : '#dc2626' }]}>
                {tx.type === 'top_up' ? '+' : ''}₦{tx.amount.toLocaleString()}
              </ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>

      {paystackVisible && (
        <Paystack  
          paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder"}
          billingEmail="customer@example.com"
          amount={parseFloat(topUpAmount)}
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
    padding: 20,
  },
  balanceCard: {
    backgroundColor: Theme.colors.primary,
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30,
    boxShadow: '0 10px 25px rgba(200, 65, 11, 0.3)',
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 36,
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginBottom: 16,
  },
  topUpSection: {
    marginBottom: 40,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  currencyPrefix: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 60,
    fontSize: 24,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  quickBtn: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Theme.colors.textSecondary,
  },
  topUpBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
  },
  topUpBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  historySection: {
    marginBottom: 40,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    fontSize: 15,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    color: Theme.colors.textSecondary,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  }
});

