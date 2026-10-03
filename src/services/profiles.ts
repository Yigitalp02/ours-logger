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
import type { Profile } from '@/types';
import { uploadImage } from '@/services/photos';

function toDate(value: Timestamp | Date | undefined): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  return value.toDate();
}

export function listenProfiles(onChange: (profiles: Profile[]) => void, onError: (error: Error) => void) {
  const q = query(collection(requireDb(), 'profiles'), orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const profiles = snapshot.docs.map((item) => {
        const data = item.data();
        return {
          id: item.id,
          name: data.name ?? 'Unnamed',
          photoUrl: data.photoUrl ?? null,
          createdAt: toDate(data.createdAt),
        } satisfies Profile;
      });
      onChange(profiles);
    },
    onError,
  );
}

export async function createProfile(name: string, localPhotoUri?: string | null): Promise<string> {
  const docRef = await addDoc(collection(requireDb(), 'profiles'), {
    name: name.trim(),
    photoUrl: null,
    createdAt: serverTimestamp(),
  });

  if (localPhotoUri) {
    const photoUrl = await uploadImage(localPhotoUri, `profiles/${docRef.id}/${createId()}.jpg`, 600);
    await updateDoc(docRef, { photoUrl });
  }

  return docRef.id;
}

export async function updateProfile(
  profileId: string,
  values: { name?: string; localPhotoUri?: string | null },
): Promise<void> {
  const payload: Record<string, unknown> = {};
  if (values.name !== undefined) payload.name = values.name.trim();
  if (values.localPhotoUri) {
    payload.photoUrl = await uploadImage(values.localPhotoUri, `profiles/${profileId}/${createId()}.jpg`, 600);
  }
  await updateDoc(doc(requireDb(), 'profiles', profileId), payload);
}

export async function deleteProfile(profileId: string): Promise<void> {
  await deleteDoc(doc(requireDb(), 'profiles', profileId));
}
