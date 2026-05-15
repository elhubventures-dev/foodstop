import { View, Text, Pressable, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

const portal =
  process.env.EXPO_PUBLIC_MERCHANT_PORTAL_URL ?? 'http://localhost:3000/merchant/login';

export default function MerchantCompanionHome() {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>Merchant companion</Text>
      <Text style={styles.body}>
        V1 opens the web merchant portal (live orders, growth, wallet, support). Enable the
        platform flag <Text style={styles.mono}>merchant_mobile_companion</Text> when you ship this app.
      </Text>
      <Pressable
        style={styles.btn}
        onPress={() => {
          void WebBrowser.openBrowserAsync(portal);
        }}
      >
        <Text style={styles.btnText}>Open merchant portal</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, padding: 24, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  body: { fontSize: 15, color: '#444', lineHeight: 22, marginBottom: 24 },
  mono: { fontFamily: 'monospace', fontSize: 13 },
  btn: {
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
