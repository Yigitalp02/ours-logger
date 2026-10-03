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
import type { Place, SpinPlace } from '@/types';

function toDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return value.toDate();
}

export function listenSpinPlaces(onChange: (places: SpinPlace[]) => void, onError: (error: Error) => void) {
  const q = query(collection(requireDb(), 'spinPlaces'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const places = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          name: data.name ?? 'Untitled place',
          details: data.details ?? '',
          place: (data.place as Place | null) ?? null,
          createdBy: data.createdBy ?? '',
          createdAt: toDate(data.createdAt),
        } satisfies SpinPlace;
      });
      onChange(places);
    },
    onError,
  );
}

export async function createSpinPlace(
  profileId: string,
  values: { name: string; details: string; place: Place | null },
): Promise<string> {
  const docRef = await addDoc(collection(requireDb(), 'spinPlaces'), {
    name: values.name.trim(),
    details: values.details.trim(),
    place: values.place,
    createdBy: profileId,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateSpinPlace(
  placeId: string,
  values: { name: string; details: string; place: Place | null },
): Promise<void> {
  await updateDoc(doc(requireDb(), 'spinPlaces', placeId), {
    name: values.name.trim(),
    details: values.details.trim(),
    place: values.place,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteSpinPlace(placeId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'spinPlaces', placeId));
}
