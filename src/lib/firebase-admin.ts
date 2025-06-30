import admin from 'firebase-admin';
import { type NextRequest } from 'next/server';

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
      console.error('Firebase admin initialization error:', error);
    }
  } else {
    console.warn("Firebase Admin credentials not set. Some backend features may not work.");
  }
}


export const adminAuth = admin.auth();
export const adminDb = admin.firestore();

export const verifyIdToken = async (req: NextRequest) => {
    const authorization = req.headers.get('Authorization');
    if (authorization?.startsWith('Bearer ')) {
        const idToken = authorization.split('Bearer ')[1];
        try {
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
