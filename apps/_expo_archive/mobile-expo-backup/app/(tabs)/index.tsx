import { Image } from 'expo-image';
import { Platform, StyleSheet, View, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Theme } from '@/constants/Theme';
import { useCartStore } from '@chopfast/shared';
import { Link } from 'expo-router';
import { supabase } from '@/lib/supabase';

export default function HomeScreen() {
  // #region agent log
  fetch('http://127.0.0.1:7284/ingest/26f413a1-96c6-4f4b-948a-7e5e0bbe3da3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'219acb'},body:JSON.stringify({sessionId:'219acb',runId:'pre-fix-2',hypothesisId:'H5',location:'apps/mobile/app/(tabs)/index.tsx:15',message:'HomeScreen entered',data:{typeofUseEffect:typeof useEffect,typeofSupabase:typeof supabase},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBranch, setSelectedBranch] = useState('Ikeja Branch');
  const [showBranchPicker, setShowBranchPicker] = useState(false);
  
  const { addItem } = useCartStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);
      
      if (data) setItems(data);
      setLoading(false);
    };

    fetchMenu();
  }, []);

  const filteredItems = selectedCategory 
    ? items.filter(item => item.category_id === selectedCategory)
    : items;

  const branches = ['Ikeja Branch', 'Lekki Phase 1', 'Victoria Island'];

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={<View style={styles.reactLogo} />}
    >
      
      <ThemedView style={styles.headerContent}>
        <View style={styles.locationSelector}>
          <IconSymbol name="mappin.and.ellipse" size={18} color={Theme.colors.primary} />
          <TouchableOpacity onPress={() => setShowBranchPicker(!showBranchPicker)}>
            <ThemedText style={styles.locationText}>{selectedBranch}</ThemedText>
          </TouchableOpacity>
          <IconSymbol name="chevron.down" size={12} color={Theme.colors.textSecondary} />
        </View>
        <ThemedText type="title">Delicious food, delivered fast 🌶️</ThemedText>
      </ThemedView>

      {showBranchPicker && (
        <ThemedView style={styles.branchPicker}>
          {branches.map(branch => (
            <TouchableOpacity 
              key={branch} 
              style={styles.branchOption}
              onPress={() => {
                setSelectedBranch(branch);
                setShowBranchPicker(false);
              }}
            >
              <ThemedText style={{ color: selectedBranch === branch ? Theme.colors.primary : Theme.colors.text }}>
                {branch}
              </ThemedText>
              {selectedBranch === branch && <IconSymbol name="checkmark" size={16} color={Theme.colors.primary} />}
            </TouchableOpacity>
          ))}
        </ThemedView>
      )}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes.
          Press{' '}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: 'cmd + d',
              android: 'cmd + m',
              web: 'F12',
            })}
          </ThemedText>{' '}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
          <Link.Preview />
          <Link.Menu>
            <Link.MenuAction title="Action" icon="cube" onPress={() => alert('Action pressed')} />
            <Link.MenuAction
              title="Share"
              icon="square.and.arrow.up"
              onPress={() => alert('Share pressed')}
            />
            <Link.Menu title="More" icon="ellipsis">
              <Link.MenuAction
                title="Delete"
                icon="trash"
                destructive
                onPress={() => alert('Delete pressed')}
              />
            </Link.Menu>
          </Link.Menu>
        </Link>

        <ThemedText>
          {`Tap the Explore tab to learn more about what's included in this starter app.`}
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{' '}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{' '}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  headerContent: {
    padding: 20,
    gap: 8,
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '700',
    color: Theme.colors.primary,
  },
  branchPicker: {
    backgroundColor: Theme.colors.surface,
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 8,
    marginTop: -10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Theme.colors.border,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  },
  branchOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
});


