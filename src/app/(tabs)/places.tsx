import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '@/components/EmptyState';
import { PlaceMap } from '@/components/PlaceMap';
import { useApp } from '@/context/AppContext';
import { formatShortDate } from '@/lib/format';
import { colors, radius } from '@/theme';
import { datePlaces } from '@/types';

export default function PlacesScreen() {
  const { dates } = useApp();
  const rows = dates.flatMap((item) =>
    datePlaces(item).map((place) => ({
      key: `${item.id}-${place.id}`,
      dateId: item.id,
      title: item.title,
      status: item.status,
      happenedAt: item.happenedAt,
      place,
    })),
  );
  const mapped = rows.map((row) => row.place).filter((place) => place.lat && place.lng);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.lead}>Logged restaurants and places you still want to go.</Text>
      {mapped.length ? <PlaceMap places={mapped} height={260} /> : null}
      {rows.length ? (
        rows.map((item) => (
          <Pressable key={item.key} style={styles.row} onPress={() => router.push(`/date/${item.dateId}`)}>
            <View style={styles.meta}>
              <Text style={styles.name}>{item.place.name}</Text>
              <Text style={styles.sub}>{item.title}</Text>
              <Text style={styles.sub}>
                {item.status === 'planned' ? 'Planned · ' : ''}
                {formatShortDate(item.happenedAt)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textDim} />
          </Pressable>
        ))
      ) : (
        <EmptyState
          title="No restaurants yet"
          body="When you log a date or save a plan, search for the restaurant and it will land on this map."
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  lead: { color: colors.textMuted, fontSize: 15, lineHeight: 22, marginBottom: 4 },
  row: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: { flex: 1, gap: 3 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 13 },
});
