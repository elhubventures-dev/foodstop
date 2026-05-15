import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect } from 'react';
import { PaystackProvider } from 'react-native-paystack-webview';

import { useColorScheme } from '@/hooks/useColorScheme';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7284/ingest/26f413a1-96c6-4f4b-948a-7e5e0bbe3da3',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'219acb'},body:JSON.stringify({sessionId:'219acb',runId:'pre-fix',hypothesisId:'H3',location:'apps/mobile/app/_layout.tsx:17',message:'Mobile root layout mounted',data:{colorScheme},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }, [colorScheme]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PaystackProvider publicKey={process.env.EXPO_PUBLIC_PAYSTACK_PUBLIC_KEY || 'pk_test_placeholder'}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </PaystackProvider>
    </ThemeProvider>
  );
}


