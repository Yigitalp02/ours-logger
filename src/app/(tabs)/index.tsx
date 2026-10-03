import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { DateCard } from '@/components/DateCard';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import { colors } from '@/theme';

export default function DiaryScreen() {
  const { loggedDates, currentProfile, error } = useApp();

  return (
    <View style={styles.screen}>
      <FlatList
        data={loggedDates}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.hello}>Hey {currentProfile?.name ?? 'you'}</Text>
            <Text style={styles.sub}>
              {loggedDates.length
                ? `${loggedDates.length} date${loggedDates.length === 1 ? '' : 's'} logged`
                : 'Your shared diary is empty'}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="No dates yet"
            body="Tap the add button to log the first one. Photos, ratings, comments, and the restaurant pin will show up on both phones."
          />
        }
        renderItem={({ item }) => (
          <DateCard item={item} onPress={() => router.push(`/date/${item.id}`)} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <Pressable style={styles.fab} onPress={() => router.push('/date-form')}>
        <Ionicons name="add" size={32} color={colors.bg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 120 },
  header: { marginBottom: 18, gap: 4 },
  hello: { color: colors.text, fontSize: 26, fontWeight: '800' },
  sub: { color: colors.textMuted, fontSize: 15 },
  error: { color: colors.danger, marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
});
