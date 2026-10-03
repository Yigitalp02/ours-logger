import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppProvider, useApp } from '@/context/AppContext';
import { colors } from '@/theme';

function RootStack() {
  const { ready, isConfigured, currentProfile } = useApp();

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.bg },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: '700' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Protected guard={!isConfigured}>
          <Stack.Screen name="setup" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={isConfigured && !currentProfile}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={isConfigured && Boolean(currentProfile)}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="date/[id]" options={{ title: 'Date' }} />
          <Stack.Screen name="date-form" options={{ title: 'New date', presentation: 'modal' }} />
          <Stack.Screen name="edit-profile" options={{ title: 'Edit profile' }} />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <AppProvider>
          <RootStack />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
