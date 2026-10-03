import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sameDay } from '@/lib/format';
import { colors, radius } from '@/theme';
import { isPlanned, type DateEntry } from '@/types';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type Props = {
  month: Date;
  dates: DateEntry[];
  selected: Date | null;
  onSelect: (day: Date) => void;
};

function daysInMonth(month: Date): Date[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: Date[] = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(new Date(NaN));
  for (let day = 1; day <= total; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  return cells;
}

export function MonthCalendar({ month, dates, selected, onSelect }: Props) {
  const cells = daysInMonth(month);
  const today = new Date();

  return (
    <View>
      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday}>
            {day}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {cells.map((day, index) => {
          if (Number.isNaN(day.getTime())) {
            return <View key={`empty-${index}`} style={styles.cell} />;
          }
          const dayItems = dates.filter((item) => sameDay(item.happenedAt, day));
          const hasLogged = dayItems.some((item) => !isPlanned(item));
          const hasPlan = dayItems.some(isPlanned);
          const isSelected = selected ? sameDay(selected, day) : false;
          const isToday = sameDay(today, day);
          return (
            <Pressable key={day.toISOString()} onPress={() => onSelect(day)} style={styles.cell}>
              <View style={[styles.day, isSelected && styles.selected, isToday && !isSelected && styles.today]}>
                <Text style={[styles.dayText, isSelected && styles.selectedText]}>{day.getDate()}</Text>
                {hasLogged || hasPlan ? (
                  <View style={styles.dots}>
                    {hasLogged ? <View style={[styles.dot, isSelected && styles.dotOnSelected]} /> : null}
                    {hasPlan ? <View style={[styles.dot, styles.planDot, isSelected && styles.dotOnSelected]} /> : null}
                  </View>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  weekRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekday: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    color: colors.textDim,
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    borderWidth: 1,
    borderColor: colors.accent,
  },
  selected: {
    backgroundColor: colors.accent,
  },
  dayText: {
    color: colors.text,
    fontWeight: '600',
  },
  selectedText: {
    color: colors.bg,
  },
  dots: {
    flexDirection: 'row',
    gap: 3,
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  planDot: {
    backgroundColor: colors.rose,
  },
  dotOnSelected: {
    backgroundColor: colors.bg,
  },
});
