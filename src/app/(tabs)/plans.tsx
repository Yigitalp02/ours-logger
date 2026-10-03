import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { DateCard } from '@/components/DateCard';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import { startOfDay } from '@/lib/format';
import { colors } from '@/theme';

export default function PlansScreen() {
  const { plannedDates } = useApp();
  const today = startOfDay(new Date());
  const unsure = plannedDates.filter((item) => !item.happenedAt);
  const upcoming = plannedDates.filter((item) => item.happenedAt && startOfDay(item.happenedAt) >= today);
  const past = plannedDates.filter((item) => item.happenedAt && startOfDay(item.happenedAt) < today);

  return (
    <View style={styles.screen}>
      <FlatList
        data={[...unsure, ...upcoming, ...past]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.sub}>
              {plannedDates.length
                ? `${unsure.length ? `${unsure.length} whenever · ` : ''}${upcoming.length} upcoming · ${plannedDates.length} saved`
                : 'Save a restaurant or a future night out'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title="Nothing planned"
            body="Add a place even if you do not know the day yet. When you go, mark it as logged and it moves into the diary."
          />
        }
        renderItem={({ item }) => (
          <View>
            {unsure.includes(item) && item.id === unsure[0]?.id ? (
              <Text style={styles.section}>Whenever</Text>
            ) : null}
            {upcoming.includes(item) && item.id === upcoming[0]?.id && unsure.length ? (
              <Text style={styles.section}>Upcoming</Text>
            ) : null}
            {past.includes(item) && item.id === past[0]?.id ? (
              <Text style={styles.section}>Passed, still planned</Text>
            ) : null}
            <DateCard item={item} onPress={() => router.push(`/date/${item.id}`)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
      <Pressable
        style={styles.fab}
        onPress={() => router.push({ pathname: '/date-form', params: { status: 'planned' } })}
      >
        <Ionicons name="add" size={32} color={colors.bg} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  list: { padding: 16, paddingBottom: 120 },
  header: { marginBottom: 18, gap: 4 },
  sub: { color: colors.textMuted, fontSize: 15 },
  section: {
    color: colors.textMuted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
    marginBottom: 10,
    marginTop: 8,
  },
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
