import { doc, onSnapshot, serverTimestamp, setDoc } from 'firebase/firestore';

import { requireDb } from '@/config/firebase';

export function listenWheelExcludedKeys(onChange: (keys: string[]) => void, onError: (error: Error) => void) {
  return onSnapshot(
    doc(requireDb(), 'settings', 'wheel'),
    (snapshot) => {
      const raw = snapshot.data()?.excludedKeys;
      onChange(Array.isArray(raw) ? raw.filter((key): key is string => typeof key === 'string') : []);
    },
    onError,
  );
}

export async function saveWheelExcludedKeys(keys: string[]): Promise<void> {
  await setDoc(
    doc(requireDb(), 'settings', 'wheel'),
    {
      excludedKeys: keys,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}
