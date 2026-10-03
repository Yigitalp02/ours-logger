import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Button } from '@/components/ui';
import { useApp } from '@/context/AppContext';
import { colors, radius } from '@/theme';

export default function ProfileScreen() {
  const { currentProfile, profiles, loggedDates, plannedDates, signOutProfile, removeProfile } = useApp();
  const other = profiles.find((profile) => profile.id !== currentProfile?.id);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <Avatar profile={currentProfile} size={92} />
        <Text style={styles.name}>{currentProfile?.name}</Text>
        <Text style={styles.meta}>
          {loggedDates.length} logged · {plannedDates.length} planned
        </Text>
      </View>
      {other ? (
        <View style={styles.other}>
          <Avatar profile={other} size={44} />
          <View>
            <Text style={styles.otherLabel}>Dating</Text>
            <Text style={styles.otherName}>{other.name}</Text>
          </View>
        </View>
      ) : (
        <Text style={styles.hint}>Your person can create the second profile on their phone.</Text>
      )}
      <Button label="Edit name or photo" onPress={() => router.push('/edit-profile')} />
      <Button
        label="Switch profile on this phone"
        variant="ghost"
        onPress={() => {
          Alert.alert('Switch profile', 'This phone will go back to the profile picker.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Switch', onPress: () => signOutProfile() },
          ]);
        }}
      />
      <Button
        label="Delete this profile"
        variant="danger"
        onPress={() => {
          Alert.alert(
            'Delete profile?',
            'This profile will be removed. Dates stay in the shared diary. You can create a new profile after.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => removeProfile() },
            ],
          );
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 24, gap: 16 },
  hero: { alignItems: 'center', gap: 10, paddingVertical: 16 },
  name: { color: colors.text, fontSize: 28, fontWeight: '800' },
  meta: { color: colors.textMuted },
  other: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  otherLabel: { color: colors.textMuted, fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
  otherName: { color: colors.text, fontSize: 18, fontWeight: '700' },
  hint: { color: colors.textMuted, lineHeight: 22 },
});
