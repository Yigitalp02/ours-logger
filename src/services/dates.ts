import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type Timestamp,
} from 'firebase/firestore';

import { requireDb } from '@/config/firebase';
import { createId } from '@/lib/id';
import type { DateComment, DateEntry, DatePhoto, DatePlace, DateRatings, DateStatus, Place } from '@/types';
import { uploadImage } from '@/services/photos';

function toDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return value.toDate();
}

function toDateOrNull(value: Timestamp | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  return value.toDate();
}

function mapPlaces(data: Record<string, unknown>): DatePlace[] {
  const raw = Array.isArray(data.places) ? (data.places as DatePlace[]) : [];
  if (raw.length) {
    return raw.map((item) => ({
      id: item.id || `${item.name}-${item.lat}`,
      name: item.name,
      address: item.address ?? '',
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      rating: Number(item.rating ?? 0),
    }));
  }
  const legacy = data.place as Place | null;
  if (!legacy) return [];
  return [
    {
      id: 'legacy',
      name: legacy.name,
      address: legacy.address,
      lat: legacy.lat,
      lng: legacy.lng,
      rating: Number(data.placeRating ?? 0),
    },
  ];
}

function mapRatings(data: Record<string, unknown>): DateRatings {
  const raw = data.ratings;
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    return Object.fromEntries(
      Object.entries(raw as Record<string, unknown>).map(([profileId, value]) => [profileId, Number(value ?? 0)]),
    );
  }
  return {};
}

function mapDate(id: string, data: Record<string, unknown>): DateEntry {
  const places = mapPlaces(data);
  const ratings = mapRatings(data);
  const overallRating = Number(data.overallRating ?? 0);
  return {
    id,
    title: (data.title as string) ?? 'Untitled date',
    happenedAt: toDateOrNull(data.happenedAt as Timestamp | Date | null | undefined),
    status: data.status === 'planned' ? 'planned' : 'logged',
    categories: (data.categories as string[]) ?? [],
    place: places[0] ?? (data.place as Place | null) ?? null,
    places,
    ratings,
    overallRating,
    placeRating: Number(places[0]?.rating ?? data.placeRating ?? 0),
    cover: (data.cover as DatePhoto | null) ?? null,
    photos: (data.photos as DatePhoto[]) ?? [],
    comments: (data.comments as DateComment[]) ?? [],
    createdBy: (data.createdBy as string) ?? '',
    createdAt: toDate(data.createdAt as Timestamp | Date | undefined),
    updatedAt: toDate(data.updatedAt as Timestamp | Date | undefined),
  };
}

export function listenDates(onChange: (dates: DateEntry[]) => void, onError: (error: Error) => void) {
  const q = query(collection(requireDb(), 'dates'), orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      onChange(snapshot.docs.map((item) => mapDate(item.id, item.data())));
    },
    onError,
  );
}

export type DateDraft = {
  title: string;
  happenedAt: Date | null;
  status?: DateStatus;
  categories: string[];
  place?: Place | null;
  places: DatePlace[];
  overallRating: number;
  ratings?: DateRatings;
  placeRating?: number;
  commentText?: string;
  cover?: DatePhoto | null;
  newCoverUri?: string | null;
  newPhotoUris?: string[];
  photos?: DatePhoto[];
};

export async function createDate(profileId: string, draft: DateDraft): Promise<string> {
  const comments: DateComment[] = draft.commentText?.trim()
    ? [
        {
          id: createId(),
          profileId,
          text: draft.commentText.trim(),
          createdAt: new Date().toISOString(),
        },
      ]
    : [];

  const docRef = await addDoc(collection(requireDb(), 'dates'), {
    title: draft.title.trim(),
    happenedAt: draft.happenedAt,
    status: draft.status ?? 'logged',
    categories: draft.categories,
    place: draft.places[0] ?? null,
    places: draft.places,
    ratings: draft.ratings ?? {},
    overallRating: draft.overallRating,
    placeRating: draft.places[0]?.rating ?? 0,
    cover: null,
    photos: [],
    comments,
    createdBy: profileId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (draft.newCoverUri) {
    const [cover] = await uploadDatePhotos(docRef.id, profileId, [draft.newCoverUri]);
    payload.cover = cover;
  }
  if (draft.newPhotoUris?.length) {
    payload.photos = await uploadDatePhotos(docRef.id, profileId, draft.newPhotoUris);
  }
  if (Object.keys(payload).length > 1) {
    await updateDoc(docRef, payload);
  }

  return docRef.id;
}

export async function updateDate(dateId: string, profileId: string, draft: DateDraft): Promise<void> {
  const photos = [...(draft.photos ?? [])];
  if (draft.newPhotoUris?.length) {
    const uploaded = await uploadDatePhotos(dateId, profileId, draft.newPhotoUris);
    photos.push(...uploaded);
  }

  let cover = draft.cover ?? null;
  if (draft.newCoverUri) {
    const [uploaded] = await uploadDatePhotos(dateId, profileId, [draft.newCoverUri]);
    cover = uploaded;
  }

  await updateDoc(doc(requireDb(), 'dates', dateId), {
    title: draft.title.trim(),
    happenedAt: draft.happenedAt,
    status: draft.status ?? 'logged',
    categories: draft.categories,
    place: draft.places[0] ?? null,
    places: draft.places,
    ratings: draft.ratings ?? {},
    overallRating: draft.overallRating,
    placeRating: draft.places[0]?.rating ?? 0,
    cover,
    photos,
    updatedAt: serverTimestamp(),
  });
}

export async function setDateStatus(dateId: string, status: DateStatus, happenedAt?: Date | null): Promise<void> {
  const payload: Record<string, unknown> = {
    status,
    updatedAt: serverTimestamp(),
  };
  if (status === 'logged') {
    payload.happenedAt = happenedAt ?? new Date();
  }
  await updateDoc(doc(requireDb(), 'dates', dateId), payload);
}

export async function addComment(date: DateEntry, profileId: string, text: string): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;
  const comments = [
    ...date.comments,
    {
      id: createId(),
      profileId,
      text: trimmed,
      createdAt: new Date().toISOString(),
    },
  ];

  await updateDoc(doc(requireDb(), 'dates', date.id), {
    comments,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteComment(date: DateEntry, commentId: string, profileId: string): Promise<void> {
  const comments = date.comments.filter(
    (comment) => !(comment.id === commentId && comment.profileId === profileId),
  );
  await updateDoc(doc(requireDb(), 'dates', date.id), {
    comments,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteDate(dateId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'dates', dateId));
}

async function uploadDatePhotos(dateId: string, profileId: string, uris: string[]): Promise<DatePhoto[]> {
  const uploads = uris.map(async (uri) => {
    const id = createId();
    const url = await uploadImage(uri, `dates/${dateId}/${id}.jpg`);
    return { id, url, uploadedBy: profileId } satisfies DatePhoto;
  });
  return Promise.all(uploads);
}
