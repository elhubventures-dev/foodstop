import React, { useState, useRef } from 'react';
import { StyleSheet, View, FlatList, Animated, useWindowDimensions, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Theme } from '@/constants/Theme';

const slides = [
  {
    id: '1',
    title: 'Authentic Nigerian Taste',
    description: 'Experience the real firewood-smoky flavor of party jollof and rich soups delivered fresh.',
    image: '/images/menu/jollof-rice-party.png',
  },
  {
    id: '2',
    title: 'Fast & Reliable Delivery',
    description: 'Track your order in real-time as our riders navigate Lagos traffic to get your chop to you hot.',
    image: '/images/brand/rider-active.png',
  },
  {
    id: '3',
    title: 'Earn as you Chop',
    description: 'Earn ChopPoints with every order and redeem them for free meals and exclusive discounts.',
    image: '/images/brand/reward-points.png',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef(null);
  const { width } = useWindowDimensions();
  const router = useRouter();

  const viewableItemsChanged = useRef(({ viewableItems }) => {
    setCurrentIndex(viewableItems[0].index);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const scrollTo = () => {
    if (currentIndex < slides.length - 1) {
      slidesRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={{ flex: 3 }}>
        <FlatList
          data={slides}
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.imageContainer}>
                 <Image 
                   source={{ uri: item.image }} 
                   style={styles.image} 
                   resizeMode="contain"
                 />
              </View>
              <View style={{ flex: 0.3, paddingHorizontal: 40 }}>
                <ThemedText style={styles.title}>{item.title}</ThemedText>
                <ThemedText style={styles.description}>{item.description}</ThemedText>
              </View>
            </View>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          ref={slidesRef}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [10, 20, 10],
              extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.3, 1, 0.3],
              extrapolate: 'clamp',
            });
            return <Animated.View style={[styles.dot, { width: dotWidth, opacity }]} key={i} />;
          })}
        </View>

        <TouchableOpacity style={styles.button} onPress={scrollTo}>
          <ThemedText style={styles.buttonText}>
            {currentIndex === slides.length - 1 ? 'Get Started' : 'Next'}
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skip} onPress={() => router.replace('/(tabs)')}>
          <ThemedText style={styles.skipText}>Skip</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    flex: 0.7,
    justifyContent: 'center',
    width: '100%',
    padding: 20,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontWeight: '800',
    fontSize: 28,
    marginBottom: 10,
    color: Theme.colors.primary,
    textAlign: 'center',
  },
  description: {
    fontWeight: '300',
    color: '#62656b',
    textAlign: 'center',
    paddingHorizontal: 10,
    lineHeight: 22,
  },
  footer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    width: '100%',
    paddingBottom: 50,
  },
  indicatorContainer: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: Theme.colors.primary,
    marginHorizontal: 8,
  },
  button: {
    backgroundColor: Theme.colors.primary,
    padding: 20,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 18,
  },
  skip: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipText: {
    color: '#9ca3af',
    fontWeight: '600',
    fontSize: 16,
  },
});

