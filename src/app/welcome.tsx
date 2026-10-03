import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { Button, Field } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { useKeyboardBottomInset } from '@/lib/keyboard';
import { colors, radius } from '@/theme';
import { MAX_PROFILES } from '@/types';

export default function WelcomeScreen() {
  const { profiles, addProfile, selectProfile, error } = useApp();
  const [name, setName] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const keyboardInset = useKeyboardBottomInset();
  const canCreate = profiles.length < MAX_PROFILES;

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos needed', 'Allow photo access so you can set a profile picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  }

  async function onCreate() {
    if (!name.trim()) {
      Alert.alert('Name missing', 'Add the name you want on your date logs.');
      return;
    }
    try {
      setSaving(true);
      await addProfile(name, photoUri);
    } catch (error) {
      Alert.alert('Could not create profile', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + keyboardInset }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Text style={styles.kicker}>Ours</Text>
        <Text style={styles.title}>Who is logging tonight?</Text>
        <Text style={styles.body}>
          No passwords. Each phone picks a profile once. Everything you add syncs to the other phone
          through Firebase.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {profiles.length > 0 ? (
          <View style={styles.block}>
            <Text style={styles.label}>Continue as</Text>
            {profiles.map((profile) => (
              <Pressable key={profile.id} style={styles.person} onPress={() => selectProfile(profile.id)}>
                <Avatar profile={profile} size={52} />
                <View style={styles.personMeta}>
                  <Text style={styles.personName}>{profile.name}</Text>
                  <Text style={styles.personHint}>Use this profile on this phone</Text>
                </View>
              </Pressable>
            ))}
          </View>
        ) : null}

        {canCreate ? (
          <View style={styles.block}>
            <Text style={styles.label}>{profiles.length ? 'Or create the other profile' : 'Create your profile'}</Text>
            <Pressable style={styles.photoPick} onPress={pickPhoto}>
              <Avatar name={name || 'You'} uri={photoUri} size={72} />
              <Text style={styles.photoHint}>Tap to add a photo</Text>
            </Pressable>
            <Field label="Name" value={name} onChangeText={setName} placeholder="Your name" />
            <Button label="Enter Ours" onPress={onCreate} loading={saving} />
          </View>
        ) : (
          <Text style={styles.note}>Both profiles are already created. Pick yours above.</Text>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 18 },
  kicker: {
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: { color: colors.text, fontSize: 34, fontWeight: '800', lineHeight: 40 },
  body: { color: colors.textMuted, fontSize: 16, lineHeight: 24 },
  block: { gap: 12 },
  label: {
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  personMeta: { flex: 1 },
  personName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  personHint: { color: colors.textMuted, marginTop: 2 },
  photoPick: { alignItems: 'center', gap: 8, marginBottom: 4 },
  photoHint: { color: colors.textMuted },
  note: { color: colors.textDim, lineHeight: 20 },
  error: { color: colors.danger, lineHeight: 20 },
});
