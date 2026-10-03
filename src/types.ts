export type Place = {
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
};

export type DatePlace = Place & {
  id: string;
  rating: number;
};

export type DatePhoto = {
  id: string;
  url: string;
  uploadedBy: string;
};

export type DateComment = {
  id: string;
  profileId: string;
  text: string;
  createdAt: string;
};

export type Profile = {
  id: string;
  name: string;
  photoUrl: string | null;
  createdAt: Date;
};

export type DateStatus = 'logged' | 'planned';

export type SpinPlace = {
  id: string;
  name: string;
  details: string;
  place: Place | null;
  createdBy: string;
  createdAt: Date;
};

export type WheelOption = {
  key: string;
  name: string;
  details: string;
  address: string;
  place: Place | null;
  source: 'plan' | 'custom';
  dateId?: string;
  planTitle?: string;
  happenedAt?: Date;
  spinPlaceId?: string;
  createdBy?: string;
  createdAt?: Date;
};

export type DateRatings = Record<string, number>;

export type DateEntry = {
  id: string;
  title: string;
  happenedAt: Date | null;
  status: DateStatus;
  categories: string[];
  place: Place | null;
  places: DatePlace[];
  ratings: DateRatings;
  overallRating: number;
  placeRating: number;
  cover: DatePhoto | null;
  photos: DatePhoto[];
  comments: DateComment[];
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export function coverUrl(entry: DateEntry): string | null {
  return entry.cover?.url ?? null;
}

export function isPlanned(entry: DateEntry): boolean {
  return entry.status === 'planned';
}

export function addedByLabel(createdBy: string | undefined, profiles: Profile[]): string {
  const name = profiles.find((profile) => profile.id === createdBy)?.name?.trim();
  return `Added by ${name || 'someone'}`;
}

export function dateRatings(entry: DateEntry): DateRatings {
  if (entry.ratings && Object.keys(entry.ratings).length) return entry.ratings;
  if (entry.overallRating && entry.createdBy) {
    return { [entry.createdBy]: entry.overallRating };
  }
  return {};
}

export function averageRating(ratings: DateRatings): number {
  const values = Object.values(ratings).filter((value) => value > 0);
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function datePlaces(entry: DateEntry): DatePlace[] {
  if (entry.places?.length) return entry.places;
  if (entry.place) {
    return [
      {
        id: 'legacy',
        name: entry.place.name,
        address: entry.place.address,
        lat: entry.place.lat,
        lng: entry.place.lng,
        rating: entry.placeRating ?? 0,
      },
    ];
  }
  return [];
}

export const DATE_CATEGORIES = [
  'Dinner',
  'Lunch',
  'Cafe',
  'Drinks',
  'Movie',
  'Concert',
  'Walk',
  'Travel',
  'Home',
  'Picnic',
  'Adventure',
  'Museum',
  'Other',
] as const;

export const MAX_PROFILES = 2;
