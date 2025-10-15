// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDdSni8w1YFnUIAyfTpkab5YyVD-zKb5ME",
  authDomain: "gui-based-network-migration.firebaseapp.com",
  projectId: "gui-based-network-migration",
  storageBucket: "gui-based-network-migration.firebasestorage.app",
  messagingSenderId: "761480977196",
  appId: "1:761480977196:web:54e9b4f1ee435689dc6a89",
  measurementId: "G-ZTSJ553FFR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);