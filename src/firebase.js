// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore'

// Firebase configuration — values come from Vite env vars (VITE_...)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
// Analytics may fail in non-browser envs; guard if needed
try {
  getAnalytics(app)
} catch (e) {
  // ignore analytics errors (e.g. running in SSR or without window)
}

// Firestore database reference
const db = getFirestore(app)

// Collection name
const PROFILES_COL = 'profiles'

// Helpers: add, update, delete, and subscribe to profiles
async function addProfile(profile) {
  // profile should be an object like { name: string, ip: string }
  const colRef = collection(db, PROFILES_COL)
  const docRef = await addDoc(colRef, {
    ...profile,
    createdAt: new Date(),
  })
  return docRef.id
}

async function updateProfile(id, data) {
  const docRef = doc(db, PROFILES_COL, id)
  await updateDoc(docRef, { ...data, updatedAt: new Date() })
}

async function setProfile(id, data) {
  const docRef = doc(db, PROFILES_COL, id)
  await setDoc(docRef, { ...data, updatedAt: new Date() }, { merge: true })
}

async function deleteProfile(id) {
  const docRef = doc(db, PROFILES_COL, id)
  await deleteDoc(docRef)
}

function subscribeProfiles(onChange) {
  // onChange will be called with an array of { id, ...data }
  const colRef = collection(db, PROFILES_COL)
  const q = query(colRef, orderBy('createdAt'))
  return onSnapshot(q, (snap) => {
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    onChange(items)
  })
}

export { db, addProfile, updateProfile, setProfile, deleteProfile, subscribeProfiles }
