import { Redirect } from 'expo-router';

import { useApp } from '@/context/AppContext';

export default function Index() {
  const { isConfigured, currentProfile } = useApp();
  if (!isConfigured) return <Redirect href="/setup" />;
  if (!currentProfile) return <Redirect href="/welcome" />;
  return <Redirect href="/(tabs)" />;
}
