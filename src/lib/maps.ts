import * as Linking from 'expo-linking';

import type { Place } from '@/types';

export function googleMapsUrl(place: Pick<Place, 'name' | 'address' | 'lat' | 'lng'>): string {
  if (typeof place.lat === 'number' && typeof place.lng === 'number') {
    return `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lng}`;
  }
  const query = [place.name, place.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export async function openInGoogleMaps(place: Pick<Place, 'name' | 'address' | 'lat' | 'lng'>): Promise<void> {
  await Linking.openURL(googleMapsUrl(place));
}
