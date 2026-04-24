import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Paystack } from 'react-native-paystack-webview';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { supabase } from '@/lib/supabase';

import { useCartStore } from '@chopfast/shared';

export default function CartScreen() {
  const router = useRouter();
  const [paystackVisible, setPaystackVisible] = useState(false);
  const [distance, setDistance] = useState(5.2); // Mock distance in km
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [isApplying, setIsApplying] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  
  const { items, updateQuantity, getTotal, clearCart, addItem } = useCartStore();
  const subtotal = getTotal();

  useEffect(() => {
    fetchProfile();
    fetchRecommendations();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      if (data) setProfile(data);
    }
  };

  const fetchRecommendations = async () => {
    // Simulated AI Logic: Suggest items from 'Grills' or 'Drinks' if they have 'Rice'
    // In a real app, this would be an edge function or a ML model endpoint
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_available', true)
      .limit(3);
    
    if (data) {
      // Filter out items already in cart
      const cartItemIds = items.map(i => i.id);
      setRecommendations(data.filter(item => !cartItemIds.includes(item.id)));
    }
  };
  
  // Dynamic Pricing Logic: Base fee + ₦200 per km + Surge
  // FREE for ChopPrime members!
  const isPrime = profile?.subscription_tier === 'prime';
  const surgeMultiplier = 1.2; // Simulated surge for busy periods
  const zoneBaseFee = 600; // Simulated zone-specific base fee
  
  const baseFee = isPrime ? 0 : zoneBaseFee;
  const perKmFee = isPrime ? 0 : 200;
  const deliveryFee = Math.round((baseFee + (distance * perKmFee)) * (isPrime ? 1 : surgeMultiplier));
  const total = subtotal + deliveryFee - discount;

  const applyPromoCode = async () => {
    if (!promoCode) return;
    setIsApplying(true);
    
    // Check coupon in Supabase
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (coupon) {
      let discountAmt = 0;
      if (coupon.discount_type === 'percentage') {
        discountAmt = (subtotal * coupon.discount_value) / 100;
      } else {
        discountAmt = coupon.discount_value;
      }
      
      setDiscount(discountAmt);
      Alert.alert('Success', `Coupon applied! You saved ₦${discountAmt.toLocaleString()}`);
    } else {
      Alert.alert('Error', 'Invalid or expired promo code.');
      setDiscount(0);
    }
    setIsApplying(false);
  };

  const handlePaymentSuccess = async (response: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create the order in Supabase
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        status: 'pending',
        subtotal,
        delivery_fee: deliveryFee,
        total,
        paystack_reference: response.reference,
        delivery_address: 'Current Location', // Simulated
        item_count: items.length
      })
      .select()
      .single();

    if (!error) {
      clearCart();
      setPaystackVisible(false);
      
      // Simulate Push Notification
      setTimeout(() => {
        Alert.alert(
          '🔔 Order Update',
          'Your order has been received and is being prepared!',
          [{ text: 'Track Order', onPress: () => router.replace('/(tabs)/orders') }]
        );
      }, 2000);

      Alert.alert(
        'Payment Successful!', 
        'Order #' + order.id.slice(0, 8) + ' has been placed.',
        [{ text: 'View Orders', onPress: () => router.replace('/(tabs)/orders') }]
      );
    } else {
      Alert.alert('Error', 'Failed to create order. Please contact support.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol size={24} name="chevron.left" color={Theme.colors.text} />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.title}>Your Cart</ThemedText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {items.map((item) => (
          <View key={item.id} style={styles.cartItem}>
            <View style={styles.itemInfo}>
              <ThemedText style={styles.itemName}>{item.name}</ThemedText>
              <ThemedText style={styles.itemPrice}>₦{item.price.toLocaleString()}</ThemedText>
            </View>
            <View style={styles.quantityControl}>
              <TouchableOpacity 
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.id, item.quantity - 1)}
              >
                <IconSymbol size={16} name="minus" color={Theme.colors.text} />
              </TouchableOpacity>
              <ThemedText style={styles.qtyText}>{item.quantity}</ThemedText>
              <TouchableOpacity 
                style={styles.qtyBtn}
                onPress={() => updateQuantity(item.id, item.quantity + 1)}
              >
                <IconSymbol size={16} name="plus" color={Theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {recommendations.length > 0 && (
          <View style={styles.recommendationSection}>
            <View style={styles.recommendationHeader}>
               <IconSymbol size={18} name="sparkles" color={Theme.colors.primary} />
               <ThemedText style={styles.recommendationTitle}>Frequently Bought Together</ThemedText>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recommendationScroll}>
              {recommendations.map((item) => (
                <View key={item.id} style={styles.recommendationCard}>
                  <ThemedText style={styles.recName} numberOfLines={1}>{item.name}</ThemedText>
                  <ThemedText style={styles.recPrice}>₦{item.price.toLocaleString()}</ThemedText>
                  <TouchableOpacity 
                    style={styles.addRecBtn}
                    onPress={() => {
                      addItem(item);
                      setRecommendations(prev => prev.filter(r => r.id !== item.id));
                    }}
                  >
                    <IconSymbol size={14} name="plus" color="white" />
                    <ThemedText style={styles.addRecText}>Add</ThemedText>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={styles.promoSection}>
          <TextInput
            style={styles.promoInput}
            placeholder="PROMO CODE"
            placeholderTextColor="#9ca3af"
            value={promoCode}
            onChangeText={setPromoCode}
            autoCapitalize="characters"
          />
          <TouchableOpacity 
            style={[styles.applyBtn, isApplying && { opacity: 0.7 }]} 
            onPress={applyPromoCode}
            disabled={isApplying}
          >
            <ThemedText style={styles.applyBtnText}>{isApplying ? '...' : 'Apply'}</ThemedText>
          </TouchableOpacity>
        </View>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
            <ThemedText style={styles.summaryValue}>₦{subtotal.toLocaleString()}</ThemedText>
          </View>
          <View style={styles.summaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
               <ThemedText style={styles.summaryLabel}>Distance ({distance}km)</ThemedText>
               {!isPrime && surgeMultiplier > 1.0 && (
                 <View style={styles.surgeBadge}>
                    <IconSymbol size={10} name="bolt.fill" color="#b45309" />
                    <ThemedText style={styles.surgeText}>SURGE</ThemedText>
                 </View>
               )}
            </View>
            <ThemedText style={[styles.summaryValue, isPrime && { color: Theme.colors.success, fontWeight: '700' }]}>
              {isPrime ? 'FREE' : `₦${deliveryFee.toLocaleString()}`}
            </ThemedText>
          </View>
          {discount > 0 && (
            <View style={styles.summaryRow}>
              <ThemedText style={[styles.summaryLabel, { color: Theme.colors.success }]}>Discount</ThemedText>
              <ThemedText style={[styles.summaryValue, { color: Theme.colors.success }]}>-₦{discount.toLocaleString()}</ThemedText>
            </View>
          )}
          <View style={[styles.summaryRow, styles.totalRow]}>
            <ThemedText style={styles.totalLabel}>Total</ThemedText>
            <ThemedText style={styles.totalValue}>₦{total.toLocaleString()}</ThemedText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.checkoutBtn}
          onPress={() => setPaystackVisible(true)}
        >
          <ThemedText style={styles.checkoutBtnText}>Checkout • ₦{total.toLocaleString()}</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Paystack Integration */}
      {paystackVisible && (
        <Paystack  
          paystackKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_placeholder"}
          billingEmail="customer@example.com"
          amount={total}
          onCancel={(e: any) => {
            setPaystackVisible(false);
          }}
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
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  cartItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Theme.colors.border,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 16,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 15,
    color: Theme.colors.primary,
    fontWeight: 'bold',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Theme.colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  qtyBtn: {
    padding: 8,
    width: 32,
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 16,
    fontWeight: '600',
    width: 24,
    textAlign: 'center',
  },
  summaryContainer: {
    marginTop: 32,
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: Theme.colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: Theme.colors.textSecondary,
    fontSize: 15,
  },
  summaryValue: {
    fontWeight: '600',
    fontSize: 15,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  recommendationSection: {
    marginTop: 32,
    backgroundColor: '#fff7ed',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  recommendationScroll: {
    gap: 12,
  },
  recommendationCard: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 16,
    width: 150,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  recName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
  },
  recPrice: {
    fontSize: 12,
    color: Theme.colors.primary,
    fontWeight: '700',
    marginBottom: 12,
  },
  surgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  surgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#b45309',
  },
  addRecBtn: {
    backgroundColor: Theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  addRecText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  promoSection: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  promoInput: {
    flex: 1,
    backgroundColor: Theme.colors.surface,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 14,
    fontWeight: '600',
    color: Theme.colors.text,
  },
  applyBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 20,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    paddingBottom: 40,
    backgroundColor: Theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: Theme.colors.border,
  },
  checkoutBtn: {
    backgroundColor: Theme.colors.primary,
    padding: 18,
    borderRadius: Theme.radius.xl,
    alignItems: 'center',
  },
  checkoutBtnText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  }
});

