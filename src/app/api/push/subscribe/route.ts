import { type NextRequest, NextResponse } from 'next/server';
import { adminDb, verifyIdToken } from '@/lib/firebase-admin';
import { type PushSubscription } from 'web-push';

export async function POST(req: NextRequest) {
  try {
    const user = await verifyIdToken(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const subscription = (await req.json()) as PushSubscription;
    if (!subscription || !subscription.endpoint) {
        return NextResponse.json({ error: 'Invalid subscription object' }, { status: 400 });
    }

    // Use endpoint as a key to avoid duplicate subscriptions
    const subscriptionRef = adminDb.collection('users').doc(user.uid).collection('pushSubscriptions').doc(Buffer.from(subscription.endpoint).toString('base64'));
    
    await subscriptionRef.set(subscription);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    if (error instanceof Error && error.message.includes('Unauthorized')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
