
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXyNBEIJgylc7qnGjpszzbut6nSHKWnVE",
  authDomain: "sulekha-devi-ms.firebaseapp.com",
  projectId: "sulekha-devi-ms",
  storageBucket: "sulekha-devi-ms.appspot.com",
  messagingSenderId: "688657575964",
  appId: "1:688657575964:web:dabbd43658adf054b82fd9",
  measurementId: "G-7HT3XT5RV1"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics if supported
let analytics;
if (typeof window !== 'undefined') {
  isSupported().then(supported => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  });
}


export { app, auth, db, analytics };
