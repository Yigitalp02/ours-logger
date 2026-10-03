import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';

const STEPS = [
  'Create a Firebase project at console.firebase.google.com',
  'Add a Web app and copy its config object',
  'Paste those keys into src/config/firebase.ts',
  'Create a Firestore database and a Storage bucket',
  'Paste the rules from the firebase/ folder',
  'Reload the app',
];

export default function SetupScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.kicker}>Almost there</Text>
        <Text style={styles.title}>Connect Firebase</Text>
        <Text style={styles.body}>
          The app is ready. It just needs your Firebase project so both phones can share dates,
          photos, and ratings in real time.
        </Text>
        {STEPS.map((step, index) => (
          <View key={step} style={styles.step}>
            <Text style={styles.index}>{index + 1}</Text>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}
        <Text style={styles.note}>
          Full walkthrough: open FIREBASE_SETUP.md in this project. After you paste the keys,
          restart Expo and the welcome screen will appear.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: 24,
    gap: 14,
  },
  kicker: {
    color: colors.accent,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  body: {
    color: colors.textMuted,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  index: {
    color: colors.accent,
    fontWeight: '800',
    width: 20,
  },
  stepText: {
    color: colors.text,
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  note: {
    color: colors.textDim,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
  },
});
