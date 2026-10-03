import { formatMonthYear, startOfDay } from '@/lib/format';
import { DATE_CATEGORIES, type DateEntry } from '@/types';

export const DIARY_PAGE_SIZE = 8;

export type DiarySort = 'newest' | 'oldest';
export type DiaryRange = 'all' | 'month' | '3months' | 'year';

export type DiaryRow =
  | { type: 'month'; key: string; label: string }
  | { type: 'date'; key: string; item: DateEntry };

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function dateValue(item: DateEntry): Date {
  return item.happenedAt ?? item.createdAt;
}

export function inDiaryRange(item: DateEntry, range: DiaryRange, month: Date, now = new Date()): boolean {
  const when = dateValue(item);
  if (range === 'all') return true;
  if (range === 'month') {
    return when >= startOfMonth(month) && when <= endOfMonth(month);
  }
  if (range === '3months') {
    const from = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 2, 1));
    return when >= from && when <= now;
  }
  const from = new Date(now.getFullYear(), 0, 1);
  return when >= startOfDay(from) && when <= now;
}

export function matchesDiaryCategory(item: DateEntry, categories: string[]): boolean {
  if (!categories.length) return true;
  return item.categories.some((category) => categories.includes(category));
}

export function sortDiaryDates(dates: DateEntry[], sort: DiarySort): DateEntry[] {
  return dates.slice().sort((a, b) => {
    const delta = dateValue(b).getTime() - dateValue(a).getTime();
    return sort === 'newest' ? delta : -delta;
  });
}

export function browseDiaryDates(
  dates: DateEntry[],
  options: { sort: DiarySort; range: DiaryRange; month: Date; categories: string[] },
): DateEntry[] {
  const next = dates.filter(
    (item) => inDiaryRange(item, options.range, options.month) && matchesDiaryCategory(item, options.categories),
  );
  return sortDiaryDates(next, options.sort);
}

export function diaryPageRows(items: DateEntry[], showMonthHeaders: boolean): DiaryRow[] {
  if (!showMonthHeaders) {
    return items.map((item) => ({ type: 'date', key: item.id, item }));
  }
  const rows: DiaryRow[] = [];
  let last = '';
  items.forEach((item) => {
    const when = item.happenedAt;
    const stamp = when ? `${when.getFullYear()}-${when.getMonth()}` : 'none';
    if (stamp !== last) {
      last = stamp;
      rows.push({
        type: 'month',
        key: `month-${stamp}`,
        label: when ? formatMonthYear(when) : 'No day',
      });
    }
    rows.push({ type: 'date', key: item.id, item });
  });
  return rows;
}

export function usedDiaryCategories(dates: DateEntry[]): string[] {
  const seen = new Set<string>();
  dates.forEach((item) => {
    item.categories.forEach((category) => seen.add(category));
  });
  return DATE_CATEGORIES.filter((category) => seen.has(category));
}
