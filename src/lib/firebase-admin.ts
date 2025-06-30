import admin from 'firebase-admin';
import { type NextRequest } from 'next/server';

const serviceAccount = {
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
};

if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
    } catch (error: any) {
        if (error.code !== 'app/duplicate-app') {
          console.error('Firebase admin initialization error', error);
        }
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
