import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAJRDqosBQP85v3C-daQ3p-B9uI_IBcafg",
  authDomain: "ocr-clarity.firebaseapp.com",
  projectId: "ocr-clarity",
  storageBucket: "ocr-clarity.firebasestorage.app",
  messagingSenderId: "1048558453552",
  appId: "1:1048558453552:web:c0e6f745188a460bfabef5",
  measurementId: "G-KEPN39ES0H"
};

// Initialize Firebase (Prevent duplicate initialization during HMR)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();

export default app;