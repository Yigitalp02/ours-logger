import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { DateCard } from '@/components/DateCard';
import { DiaryBrowseBar } from '@/components/DiaryBrowseBar';
import { EmptyState } from '@/components/EmptyState';
import { useApp } from '@/context/AppContext';
import {
  browseDiaryDates,
  diaryPageRows,
  DIARY_PAGE_SIZE,
  usedDiaryCategories,
  type DiaryRange,
  type DiaryRow,
  type DiarySort,
} from '@/lib/diary';
import { colors, radius } from '@/theme';

export default function DiaryScreen() {
  const { loggedDates, currentProfile, error } = useApp();
  const [sort, setSort] = useState<DiarySort>('newest');
  const [range, setRange] = useState<DiaryRange>('all');
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(0);

  const availableCategories = useMemo(() => usedDiaryCategories(loggedDates), [loggedDates]);
  const filtered = useMemo(
    () => browseDiaryDates(loggedDates, { sort, range, month, categories }),
    [categories, loggedDates, month, range, sort],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / DIARY_PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * DIARY_PAGE_SIZE, (safePage + 1) * DIARY_PAGE_SIZE);
  const rows = useMemo(() => diaryPageRows(pageItems, range !== 'month'), [pageItems, range]);
  const from = filtered.length ? safePage * DIARY_PAGE_SIZE + 1 : 0;
  const to = Math.min(filtered.length, (safePage + 1) * DIARY_PAGE_SIZE);

  function resetPage() {
    setPage(0);
  }

  function onToggleCategory(category: string) {
    resetPage();
    if (!category) {
      setCategories([]);
      return;
    }
    setCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(row) => row.key}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.hello}>Hey {currentProfile?.name ?? 'you'}</Text>
            <Text style={styles.sub}>
              {loggedDates.length
                ? `${loggedDates.length} date${loggedDates.length === 1 ? '' : 's'} logged${
                    filtered.length !== loggedDates.length ? ` · ${filtered.length} in this view` : ''
                  }${filtered.length ? ` · ${from}-${to}` : ''}`
                : 'Your shared diary is empty'}
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loggedDates.length ? (
              <DiaryBrowseBar
                sort={sort}
                range={range}
                month={month}
                categories={categories}
                availableCategories={availableCategories}
                onSort={(next) => {
                  resetPage();
                  setSort(next);
                }}
                onRange={(next) => {
                  resetPage();
                  setRange(next);
                  if (next === 'month') {
                    setMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
                  }
                }}
                onShiftMonth={(delta) => {
                  resetPage();
                  setMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
                }}
                onToggleCategory={onToggleCategory}
              />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            title={loggedDates.length ? 'Nothing in this view' : 'No dates yet'}
            body={
              loggedDates.length
                ? 'Try another month, time range, or category.'
                : 'Tap the add button to log the first one. Photos, ratings, comments, and the restaurant pin will show up on both phones.'
            }
          />
        }
        renderItem={({ item }: { item: DiaryRow }) =>
          item.type === 'month' ? (
            <Text style={styles.monthHead}>{item.label}</Text>
          ) : (
            <DateCard item={item.item} onPress={() => router.push(`/date/${item.item.id}`)} />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        ListFooterComponent={
          filtered.length > DIARY_PAGE_SIZE ? (
            <View style={styles.pager}>
              <Pressable
                onPress={() => setPage((current) => Math.max(0, current - 1))}
                disabled={safePage === 0}
                style={[styles.pageBtn, safePage === 0 && styles.pageBtnOff]}
              >
                <Ionicons name="chevron-back" size={18} color={safePage === 0 ? colors.textDim : colors.text} />
                <Text style={[styles.pageBtnText, safePage === 0 && styles.pageBtnTextOff]}>Prev</Text>
              </Pressable>
              <Text style={styles.pageLabel}>
                Page {safePage + 1} of {pageCount}
              </Text>
              <Pressable
                onPress={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
                disabled={safePage >= pageCount - 1}
                style={[styles.pageBtn, safePage >= pageCount - 1 && styles.pageBtnOff]}
              >
                <Text style={[styles.pageBtnText, safePage >= pageCount - 1 && styles.pageBtnTextOff]}>Next</Text>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={safePage >= pageCount - 1 ? colors.textDim : colors.text}
                />
              </Pressable>
            </View>
          ) : null
        }
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
  monthHead: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  pageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    minHeight: 40,
  },
  pageBtnOff: { opacity: 0.45 },
  pageBtnText: { color: colors.text, fontWeight: '700' },
  pageBtnTextOff: { color: colors.textDim },
  pageLabel: { color: colors.textMuted, fontWeight: '700' },
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
