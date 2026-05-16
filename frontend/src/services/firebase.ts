import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

/**
 * Firebase client configuration.
 * All values are injected at build time via Vite's `envPrefix: 'REACT_APP_'`.
 */
const firebaseConfig = {
  apiKey: import.meta.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.REACT_APP_FIREBASE_APP_ID,
};

/**
 * Initialize the Firebase app once.
 * Safe to import from multiple modules — Firebase caches the instance.
 */
export const app = initializeApp(firebaseConfig);

/** Firestore database instance for real-time listeners. */
export const db = getFirestore(app);

/** Firebase Storage instance for obstacle photo uploads. */
export const storage = getStorage(app);
