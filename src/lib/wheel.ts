import type { DateEntry, SpinPlace, WheelOption } from '@/types';
import { datePlaces } from '@/types';

export { addedByLabel } from '@/types';

export function buildWheelOptions(plannedDates: DateEntry[], spinPlaces: SpinPlace[]): WheelOption[] {
  const fromPlans: WheelOption[] = plannedDates.flatMap((entry): WheelOption[] => {
    const places = datePlaces(entry);
    const notes = entry.comments.map((comment) => comment.text).filter(Boolean).join('\n');

    if (!places.length) {
      return [
        {
          key: `plan:${entry.id}`,
          name: entry.title,
          details: notes,
          address: '',
          place: null,
          source: 'plan',
          dateId: entry.id,
          planTitle: entry.title,
          happenedAt: entry.happenedAt ?? undefined,
          createdBy: entry.createdBy,
          createdAt: entry.createdAt,
        },
      ];
    }

    return places.map((place) => ({
      key: `plan:${entry.id}:${place.id}`,
      name: place.name,
      details: notes,
      address: place.address,
      place,
      source: 'plan',
      dateId: entry.id,
      planTitle: entry.title,
      happenedAt: entry.happenedAt ?? undefined,
      createdBy: entry.createdBy,
      createdAt: entry.createdAt,
    }));
  });

  const custom: WheelOption[] = spinPlaces.map((item) => ({
    key: `custom:${item.id}`,
    name: item.name,
    details: item.details,
    address: item.place?.address ?? '',
    place: item.place,
    source: 'custom' as const,
    spinPlaceId: item.id,
    createdBy: item.createdBy,
    createdAt: item.createdAt,
  }));

  return [...fromPlans, ...custom];
}

export function activeWheelOptions(options: WheelOption[], excludedKeys: string[]): WheelOption[] {
  const hidden = new Set(excludedKeys);
  return options.filter((item) => !hidden.has(item.key));
}
