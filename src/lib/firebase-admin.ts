import admin from 'firebase-admin';
import { type NextRequest } from 'next/server';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  const serviceAccount = {
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      // Use logical OR to handle undefined case before calling replace
      privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
  };

  admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
  });
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
