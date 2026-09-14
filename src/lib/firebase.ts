import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import appletConfig from "../../firebase-applet-config.json";

// Initialize Firebase using the active applet configuration
export const firebaseConfig = appletConfig;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore strictly matching skill guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);


