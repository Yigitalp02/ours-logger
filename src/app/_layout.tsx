import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { OpeningSplash } from '@/components/OpeningSplash';
import { AppProvider, useApp } from '@/context/AppContext';
import { colors } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { ready, isConfigured, currentProfile } = useApp();
  const [introDone, setIntroDone] = useState(false);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  return (
    <View style={styles.flex}>
      {ready ? (
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
      ) : null}
      {introDone ? null : <OpeningSplash appReady={ready} onFinished={finishIntro} />}
    </View>
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
});
