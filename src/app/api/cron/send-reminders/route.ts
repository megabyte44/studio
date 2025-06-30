
import { type NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import webpush, { type PushSubscription } from 'web-push';
import '@/lib/web-push'; // Initializes web-push
import { format } from 'date-fns';
import type { Notification as Reminder } from '@/types';

// This function should be called by a cron job, e.g., once daily.
// It checks for any reminders scheduled for the current day and sends them.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const todayKey = format(new Date(), 'yyyy-MM-dd');

  try {
    const usersSnapshot = await adminDb.collection('users').get();
    let notificationsSent = 0;

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const remindersDocRef = adminDb.doc(`users/${userId}/data/notifications`);
      const remindersDoc = await remindersDocRef.get();

      if (!remindersDoc.exists) continue;

      const remindersData = (remindersDoc.data() as { items: Reminder[] }).items;
      const todaysReminders = remindersData.filter(r => r.date === todayKey);

      if (todaysReminders.length === 0) continue;

      const subscriptionsSnapshot = await adminDb.collection('users').doc(userId).collection('pushSubscriptions').get();
      if (subscriptionsSnapshot.empty) continue;
      
      for (const reminder of todaysReminders) {
        const payload = JSON.stringify({
          title: reminder.title,
          body: reminder.message,
        });

        const sendPromises = subscriptionsSnapshot.docs.map(doc => {
          const sub = doc.data() as PushSubscription;
          return webpush.sendNotification(sub, payload).catch(error => {
            // If subscription is expired or invalid, delete it from Firestore.
            if (error.statusCode === 404 || error.statusCode === 410) {
              console.log(`Subscription for user ${userId} has expired or is no longer valid. Deleting.`);
              return doc.ref.delete();
            } else {
              console.error(`Error sending notification to user ${userId}:`, error.body);
            }
          });
        });

        await Promise.all(sendPromises);
        notificationsSent++;
      }
    }

    return NextResponse.json({ success: true, message: `Check complete. Sent ${notificationsSent} reminder notifications.` });
  } catch (error) {
    console.error('Error in reminder cron job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
