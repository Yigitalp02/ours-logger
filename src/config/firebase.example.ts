import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

// Copy this file to src/config/firebase.ts and paste the Web app config
// from Firebase Console > Project settings > Your apps.
// Do not commit firebase.ts. See FIREBASE_SETUP.md.
export const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT_ID.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

export const isFirebaseConfigured =
  Boolean(firebaseConfig.apiKey) && !firebaseConfig.apiKey.startsWith('YOUR_');

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  storage = getStorage(app);
}

export { app, db, storage };

export function requireDb(): Firestore {
  if (!db) {
    throw new Error('Firebase is not configured yet. Add your keys in src/config/firebase.ts');
  }
  return db;
}

export function requireStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error('Firebase Storage is not configured yet. Add your keys in src/config/firebase.ts');
  }
  return storage;
}
