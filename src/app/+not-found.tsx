import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme';

export default function NotFoundScreen() {
  return (
    <View style={styles.screen}>
      <Stack.Screen options={{ title: 'Missing' }} />
      <Text style={styles.title}>This page is not in the diary.</Text>
      <Link href="/" style={styles.link}>
        Go home
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
  },
});
