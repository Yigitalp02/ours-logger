import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { DateCard } from '@/components/DateCard';
import { EmptyState } from '@/components/EmptyState';
import { MonthCalendar } from '@/components/MonthCalendar';
import { useApp } from '@/context/AppContext';
import { formatMonthYear, formatWhenShort, sameDay } from '@/lib/format';
import { colors, radius } from '@/theme';

export default function CalendarScreen() {
  const { dates } = useApp();
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | null>(new Date());

  const selectedDates = useMemo(
    () => (selected ? dates.filter((item) => sameDay(item.happenedAt, selected)) : []),
    [dates, selected],
  );

  function shiftMonth(delta: number) {
    setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.monthBar}>
        <Pressable onPress={() => shiftMonth(-1)} style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.month}>{formatMonthYear(month)}</Text>
        <Pressable onPress={() => shiftMonth(1)} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </Pressable>
      </View>
      <MonthCalendar month={month} dates={dates} selected={selected} onSelect={setSelected} />
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.accent }]} />
          <Text style={styles.legendText}>Logged</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.rose }]} />
          <Text style={styles.legendText}>Planned</Text>
        </View>
      </View>
      <Text style={styles.section}>
        {selected ? formatWhenShort(selected) : 'Pick a day'}
      </Text>
      {selectedDates.length ? (
        selectedDates.map((item) => (
          <View key={item.id} style={styles.cardWrap}>
            <DateCard compact item={item} onPress={() => router.push(`/date/${item.id}`)} />
          </View>
        ))
      ) : (
        <EmptyState title="Nothing on this day" body="Add a logged date from Diary or a future plan from Plans." />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 80 },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  month: { color: colors.text, fontSize: 20, fontWeight: '800' },
  legend: { flexDirection: 'row', gap: 16, marginTop: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  arrow: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 22,
    marginBottom: 12,
  },
  cardWrap: { marginBottom: 12 },
});
