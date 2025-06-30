import admin from 'firebase-admin';
import { type NextRequest } from 'next/server';

function createLazyProxy<T extends object>(serviceName: string): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      throw new Error(`Firebase Admin SDK not initialized. Cannot access ${serviceName}.${String(prop)}. Please check your environment variables.`);
    }
  });
}

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  const {
    FIREBASE_ADMIN_PROJECT_ID,
    FIREBASE_ADMIN_PRIVATE_KEY,
    FIREBASE_ADMIN_CLIENT_EMAIL,
  } = process.env;

  if (FIREBASE_ADMIN_PROJECT_ID && FIREBASE_ADMIN_PRIVATE_KEY && FIREBASE_ADMIN_CLIENT_EMAIL) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: FIREBASE_ADMIN_PROJECT_ID,
          privateKey: FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: FIREBASE_ADMIN_CLIENT_EMAIL,
        }),
      });
    } catch (error) {
      console.error('Firebase admin initialization error:', error instanceof Error ? error.message : String(error));
    }
  } else {
    console.warn("Firebase Admin credentials not set. Some backend features may not work if not configured at runtime.");
  }
}

const isInitialized = admin.apps.length > 0;

export const adminAuth: admin.auth.Auth = isInitialized ? admin.auth() : createLazyProxy<admin.auth.Auth>('auth');
export const adminDb: admin.firestore.Firestore = isInitialized ? admin.firestore() : createLazyProxy<admin.firestore.Firestore>('firestore');

export const verifyIdToken = async (req: NextRequest) => {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        try {
            if (!isInitialized) {
                throw new Error('Firebase Admin SDK has not been initialized.');
            }
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            return decodedToken;
        } catch (error) {
            console.error('Error verifying token:', error);
            throw new Error('Unauthorized');
        }
    }
    throw new Error('Unauthorized');
};

export default admin;
