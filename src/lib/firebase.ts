import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Analytics conditionally and safely
export const analytics = typeof window !== 'undefined' 
  ? isSupported().then(yes => yes ? getAnalytics(app) : null).catch(() => null)
  : null;

// Initialize Firestore - common practice is to omit the ID if it's (default)
const config = firebaseConfig as any;
export const db = config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)'
  ? getFirestore(app, config.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

async function testConnection() {
  if (typeof window === 'undefined') return;
  
  try {
    // Attempting to see if we can reach the server
    await getDocFromServer(doc(db, '_connection_test_', 'ping'));
  } catch (error: any) {
    if (error?.code === 'unavailable' || error?.message?.includes('offline')) {
      console.warn("Firebase: Client appears to be offline or Firestore is not enabled for this project.");
    } else if (error?.code === 'permission-denied') {
      console.info("Firebase: Connection successful (Permission denied as expected for uninitialized path).");
    } else {
      console.error("Firebase Connection Error:", error);
    }
  }
}

testConnection();
