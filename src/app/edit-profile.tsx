import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button, Field } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { useKeyboardBottomInset } from '@/lib/keyboard';
import { colors } from '@/theme';

export default function EditProfileScreen() {
  const { currentProfile, saveProfile } = useApp();
  const [name, setName] = useState(currentProfile?.name ?? '');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const keyboardInset = useKeyboardBottomInset();

  async function pickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Photos needed', 'Allow photo access to change your profile picture.');
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

  async function onSave() {
    if (!name.trim()) {
      Alert.alert('Name missing', 'Keep a name on the profile.');
      return;
    }
    try {
      setSaving(true);
      await saveProfile({ name, localPhotoUri: photoUri });
      router.back();
    } catch (error) {
      Alert.alert('Could not update profile', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 32 + keyboardInset }]}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        <Pressable style={styles.photo} onPress={pickPhoto}>
          <Avatar profile={currentProfile} uri={photoUri} size={96} />
          <Text style={styles.hint}>Tap to change photo</Text>
        </Pressable>
        <Field label="Name" value={name} onChangeText={setName} />
        <Button label="Save profile" onPress={onSave} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 18 },
  photo: { alignItems: 'center', gap: 10, marginBottom: 8 },
  hint: { color: colors.textMuted },
});
