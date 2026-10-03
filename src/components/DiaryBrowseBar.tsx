import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatMonthYear } from '@/lib/format';
import type { DiaryRange, DiarySort } from '@/lib/diary';
import { colors, radius } from '@/theme';

type Props = {
  sort: DiarySort;
  range: DiaryRange;
  month: Date;
  categories: string[];
  availableCategories: string[];
  onSort: (sort: DiarySort) => void;
  onRange: (range: DiaryRange) => void;
  onShiftMonth: (delta: number) => void;
  onToggleCategory: (category: string) => void;
};

const RANGE_LABEL: Record<DiaryRange, string> = {
  all: 'All time',
  month: 'This month',
  '3months': 'Last 3 months',
  year: 'This year',
};

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

function summary(sort: DiarySort, range: DiaryRange, month: Date, categories: string[]): string {
  const parts = [sort === 'newest' ? 'Newest' : 'Oldest', range === 'month' ? formatMonthYear(month) : RANGE_LABEL[range]];
  if (categories.length) parts.push(categories.join(', '));
  return parts.join(' · ');
}

export function DiaryBrowseBar({
  sort,
  range,
  month,
  categories,
  availableCategories,
  onSort,
  onRange,
  onShiftMonth,
  onToggleCategory,
}: Props) {
  const [open, setOpen] = useState(false);
  const filtered = sort !== 'newest' || range !== 'all' || categories.length > 0;

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => setOpen((current) => !current)}
        style={styles.toggle}
        accessibilityRole="button"
        accessibilityLabel={open ? 'Hide filters' : 'Show filters'}
      >
        <Ionicons name="options-outline" size={18} color={filtered ? colors.accent : colors.textMuted} />
        <Text style={[styles.toggleText, filtered && styles.toggleTextOn]} numberOfLines={1}>
          {summary(sort, range, month, categories)}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textMuted} />
      </Pressable>

      {open ? (
        <View style={styles.panel}>
          <View style={styles.row}>
            <Chip label="Newest" active={sort === 'newest'} onPress={() => onSort('newest')} />
            <Chip label="Oldest" active={sort === 'oldest'} onPress={() => onSort('oldest')} />
          </View>
          <View style={styles.row}>
            <Chip label="All time" active={range === 'all'} onPress={() => onRange('all')} />
            <Chip label="Month" active={range === 'month'} onPress={() => onRange('month')} />
            <Chip label="3 months" active={range === '3months'} onPress={() => onRange('3months')} />
            <Chip label="This year" active={range === 'year'} onPress={() => onRange('year')} />
          </View>
          {availableCategories.length ? (
            <View style={styles.row}>
              <Chip label="All types" active={categories.length === 0} onPress={() => onToggleCategory('')} />
              {availableCategories.map((category) => (
                <Chip
                  key={category}
                  label={category}
                  active={categories.includes(category)}
                  onPress={() => onToggleCategory(category)}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {range === 'month' ? (
        <View style={styles.monthBar}>
          <Pressable onPress={() => onShiftMonth(-1)} style={styles.arrow} accessibilityLabel="Previous month">
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </Pressable>
          <Text style={styles.month}>{formatMonthYear(month)}</Text>
          <Pressable onPress={() => onShiftMonth(1)} style={styles.arrow} accessibilityLabel="Next month">
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8, marginTop: 8 },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  toggleText: { flex: 1, color: colors.textMuted, fontSize: 13, fontWeight: '700' },
  toggleTextOn: { color: colors.accent },
  panel: { gap: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.bgElevated,
  },
  chipOn: {
    backgroundColor: colors.accentSoft,
    borderColor: colors.accent,
  },
  chipText: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  chipTextOn: { color: colors.accent },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 6,
  },
  month: { color: colors.text, fontSize: 15, fontWeight: '800' },
  arrow: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
