import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const hasClientConfig =
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId;

let app: FirebaseApp | null = null;

if (hasClientConfig) {
    try {
        app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
    } catch (error) {
        console.warn("Firebase client initialization failed:", error);
    }
} else {
    console.warn("Firebase client config missing; skipping initialization (set NEXT_PUBLIC_FIREBASE_* env vars).");
}

const auth = app ? getAuth(app) : (null as unknown as ReturnType<typeof getAuth>);
const db = app ? getFirestore(app) : (null as unknown as ReturnType<typeof getFirestore>);

export { app, auth, db };
