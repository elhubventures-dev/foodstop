import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: 'Food Stop merchant',
        headerShadowVisible: false,
      }}
    />
  );
}
