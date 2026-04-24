import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Dimensions, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Theme } from '@/constants/Theme';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function RiderMap() {
  const [location, setLocation] = useState<any>(null);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchActiveOrder = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('rider_id', user.id)
      .eq('status', 'out_for_delivery')
      .single();
    
    if (data) setActiveOrder(data);
    else setActiveOrder(null);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to use the map.');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    })();

    fetchActiveOrder();
    
    const interval = setInterval(fetchActiveOrder, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  if (!location) {
    return (
      <ThemedView style={styles.emptyContainer}>
        <ThemedText>Loading map...</ThemedText>
      </ThemedView>
    );
  }

  // Mock coordinates for Nigerian locations if no real address
  const restaurantLoc = { latitude: 6.4527, longitude: 3.3915 }; // Lagos area
  const deliveryLoc = { latitude: 6.4600, longitude: 3.4100 }; // Nearby

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        showsUserLocation
      >
        {activeOrder && (
          <>
            <Marker 
              coordinate={restaurantLoc} 
              title="Food Stop Hub" 
              description="Pickup point"
            >
              <View style={styles.marker}>
                <IconSymbol name="house.fill" size={20} color="white" />
              </View>
            </Marker>
            
            <Marker 
              coordinate={deliveryLoc} 
              title="Customer Destination" 
              description={activeOrder.delivery_address}
            >
              <View style={[styles.marker, { backgroundColor: Theme.colors.primary }]}>
                <IconSymbol name="person.fill" size={20} color="white" />
              </View>
            </Marker>

            <Polyline
              coordinates={[restaurantLoc, deliveryLoc]}
              strokeWidth={3}
              strokeColor={Theme.colors.primary}
            />
          </>
        )}
      </MapView>

      {activeOrder ? (
        <View style={styles.orderOverlay}>
           <ThemedText type="subtitle" style={{ color: 'white' }}>Current Delivery</ThemedText>
           <ThemedText style={{ color: 'white', opacity: 0.9 }}>#{activeOrder.id.slice(0, 8)}</ThemedText>
           <ThemedText style={{ color: 'white', marginTop: 8, fontSize: 13 }}>{activeOrder.delivery_address}</ThemedText>
        </View>
      ) : (
        <View style={styles.noOrderOverlay}>
           <IconSymbol name="bicycle" size={24} color={Theme.colors.textSecondary} />
           <ThemedText style={{ color: Theme.colors.textSecondary }}>No active delivery in progress</ThemedText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  orderOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  noOrderOverlay: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  }
});
