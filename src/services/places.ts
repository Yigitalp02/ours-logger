import type { Place } from '@/types';

type PhotonFeature = {
  geometry?: { coordinates?: number[] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    district?: string;
  };
};

type PhotonResponse = {
  features?: PhotonFeature[];
};

function featureToPlace(feature: PhotonFeature): Place | null {
  const [lng, lat] = feature.geometry?.coordinates ?? [];
  if (typeof lat !== 'number' || typeof lng !== 'number') return null;

  const props = feature.properties ?? {};
  const locality = props.city || props.town || props.village || props.district || '';
  const street = [props.street, props.housenumber].filter(Boolean).join(' ');
  const address = [street, locality, props.state, props.country].filter(Boolean).join(', ');
  const name = props.name || street || locality || 'Selected place';

  return {
    name,
    address: address || name,
    lat,
    lng,
  };
}

export async function searchPlaces(query: string): Promise<Place[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', trimmed);
  url.searchParams.set('limit', '8');

  const response = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error('Place search failed. Try again in a moment.');
  }

  const data = (await response.json()) as PhotonResponse;
  const places = (data.features ?? [])
    .map(featureToPlace)
    .filter((item): item is Place => Boolean(item));

  const seen = new Set<string>();
  return places.filter((item) => {
    const key = `${item.name}|${item.lat}|${item.lng}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
