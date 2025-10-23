// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Use Vite env vars from your .env file
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  // measurementId is optional and only needed if you use Analytics
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Ensure we have a user (Anonymous Auth) so rules can use request.auth.uid
export function ensureAnon() {
  return new Promise((resolve, reject) => {
    const off = onAuthStateChanged(auth, async (u) => {
      try {
        if (!u) await signInAnonymously(auth);
        resolve(auth.currentUser);
      } catch (e) {
        reject(e);
      } finally {
        off();
      }
    });
  });
}
