import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Theme } from '@/constants/Theme';
import { IconSymbol } from '@/components/ui/IconSymbol';
import * as Haptics from 'expo-haptics';

import { useCartStore } from '@chopfast/shared';

interface FoodCardProps {
  item: {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    spice_level?: number;
    dietary_tags?: string[];
    merchant_id?: string;
  };
  onAddPress?: () => void;
}

export const FoodCard = ({ item, onAddPress }: FoodCardProps) => {
  const addItem = useCartStore((state) => state.addItem);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image_url: item.image_url,
      quantity: 1,
      merchant_id: item.merchant_id,
    });
    onAddPress?.();
  };

  const renderSpiceLevel = () => {
    if (!item.spice_level) return null;
    return (
      <View style={styles.spiceContainer}>
        {[...Array(item.spice_level)].map((_, i) => (
          <Text key={i} style={styles.spiceIcon}>🌶️</Text>
        ))}
      </View>
    );
  };

  return (
    <Pressable style={styles.container}>
      <View style={styles.imageContainer}>
        {/* Placeholder for real images since we are in local development */}
        <View style={styles.imagePlaceholder}>
           <IconSymbol size={48} name="fork.knife" color="#ccc" />
        </View>
        
        {item.dietary_tags?.includes('popular') && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Bestseller</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
          {renderSpiceLevel()}
        </View>
        
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.footer}>
          <Text style={styles.price}>₦{item.price.toLocaleString()}</Text>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            <IconSymbol size={20} name="plus" color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Theme.colors.surface,
    borderRadius: Theme.radius.lg,
    marginBottom: Theme.spacing.md,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    height: 160,
    width: '100%',
    backgroundColor: '#f1f5f9',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: Theme.colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  content: {
    padding: Theme.spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Theme.colors.text,
    flex: 1,
  },
  spiceContainer: {
    flexDirection: 'row',
  },
  spiceIcon: {
    fontSize: 12,
    marginLeft: 2,
  },
  description: {
    fontSize: 13,
    color: Theme.colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Theme.colors.primary,
  },
  addButton: {
    backgroundColor: Theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});


