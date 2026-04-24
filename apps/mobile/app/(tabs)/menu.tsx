import { StyleSheet, View, ScrollView, TextInput } from 'react-native';
import { Theme } from '@/constants/Theme';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { FoodCard } from '@/components/menu/FoodCard';
import { Collapsible } from '@/components/Collapsible';
import { IconSymbol } from '@/components/ui/IconSymbol';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

export default function MenuScreen() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          category:categories(slug)
        `)
        .eq('is_available', true);
        
      if (data) {
        const formattedItems = data.map(item => ({
          ...item,
          category_slug: item.category?.slug
        }));
        setItems(formattedItems);
      }
      setLoading(false);
    };

    fetchMenu();
  }, []);

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const getItemsByCategory = (slug: string) => {
    return filteredItems.filter(item => item.category_slug === slug);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.header}>
        <ThemedText type="title" style={styles.title}>Our Menu</ThemedText>
        <ThemedText style={styles.subtitle}>Authentic Nigerian flavors delivered to your door.</ThemedText>
        
        <View style={styles.searchContainer}>
           <IconSymbol size={20} name="magnifyingglass" color="#9ca3af" style={styles.searchIcon} />
           <TextInput 
              style={styles.searchInput}
              placeholder="Search dishes..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
           />
        </View>
      </ThemedView>

      {filteredItems.length > 0 ? (
        <>
          <Collapsible title="Rice Dishes" defaultOpen={!searchQuery}>
            <View style={styles.categoryGrid}>
              {getItemsByCategory('rice').map(item => (
                <FoodCard key={item.id} item={item} />
              ))}
            </View>
          </Collapsible>

          <Collapsible title="Swallow & Soups" defaultOpen={!!searchQuery}>
            <View style={styles.categoryGrid}>
              {getItemsByCategory('swallow').map(item => (
                <FoodCard key={item.id} item={item} />
              ))}
            </View>
          </Collapsible>

          <Collapsible title="Grills & BBQ" defaultOpen={!!searchQuery}>
            <View style={styles.categoryGrid}>
              {getItemsByCategory('grill').map(item => (
                <FoodCard key={item.id} item={item} />
              ))}
            </View>
          </Collapsible>

          <Collapsible title="Authentic Soups" defaultOpen={!!searchQuery}>
            <View style={styles.categoryGrid}>
              {getItemsByCategory('soups').map(item => (
                <FoodCard key={item.id} item={item} />
              ))}
            </View>
          </Collapsible>
        </>
      ) : (
        <View style={styles.emptyState}>
           <IconSymbol size={64} name="face.dashed" color="#ccc" />
           <ThemedText style={{ marginTop: 16, color: Theme.colors.textSecondary }}>No dishes match your search.</ThemedText>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.colors.background,
  },
  content: {
    padding: Theme.spacing.md,
    paddingTop: 64, // Space for status bar/safe area
    paddingBottom: 100, // Space for tab bar
  },
  header: {
    marginBottom: Theme.spacing.lg,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Theme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: Theme.colors.textSecondary,
    marginTop: 4,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 15,
    color: Theme.colors.text,
  },
  categoryGrid: {
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  }
});
