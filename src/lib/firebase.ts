import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserSessionPersistence } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import appletConfig from "../../firebase-applet-config.json";

// Initialize Firebase using the active applet configuration
export const firebaseConfig = appletConfig;

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserSessionPersistence).catch(() => {});
export const googleProvider = new GoogleAuthProvider();

// Initialize Firestore strictly matching skill guidelines
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Test Firestore connection on boot as mandated by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();


