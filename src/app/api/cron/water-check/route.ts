
import { type NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import webpush, { type PushSubscription } from 'web-push';
import '@/lib/web-push'; // Initializes web-push
import { format } from 'date-fns';
import type { Habit } from '@/types';

// This function can be called by a cron job at specific times.
// It is protected by a secret key to prevent unauthorized access.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const currentHour = now.getHours();
  const todayKey = format(now, 'yyyy-MM-dd');
  
  let requiredPercentage = 0;
  let notificationTitle = '';
  let notificationBody = '';

  // Determine which check to perform based on the current time.
  // It's recommended to run the cron job slightly before the deadline (e.g., 11:55, 17:55, 21:55).
  if (currentHour >= 11 && currentHour < 12) { // 11 AM check for 12 PM deadline
    requiredPercentage = 0.30;
    notificationTitle = 'Water Reminder!';
    notificationBody = "Don't forget to stay hydrated. Aim for 30% of your goal by noon!";
  } else if (currentHour >= 17 && currentHour < 18) { // 5 PM check for 6 PM deadline
    requiredPercentage = 0.70;
    notificationTitle = 'Evening Hydration Check';
    notificationBody = "Keep it up! Try to hit 70% of your water goal by 6 PM.";
  } else if (currentHour >= 21 && currentHour < 22) { // 9 PM check for 10 PM deadline
    requiredPercentage = 1.0;
    notificationTitle = 'Final Water Reminder';
    notificationBody = "Almost there! Complete your daily water intake goal before bed.";
  } else {
    return NextResponse.json({ success: true, message: 'Not a scheduled check time.' });
  }

  try {
    const usersSnapshot = await adminDb.collection('users').get();
    let notificationsSent = 0;
    
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      const habitsDocRef = adminDb.doc(`users/${userId}/data/habits`);
      const habitsDoc = await habitsDocRef.get();

      if (!habitsDoc.exists()) continue;

      const habitsData = (habitsDoc.data() as { items: Habit[] }).items;
      const waterHabit = habitsData.find(h => h.icon === 'GlassWater');

      if (!waterHabit || !waterHabit.target || waterHabit.target <= 0) continue;

      const target = waterHabit.target;
      const completions = waterHabit.completions || {};
      const glassesToday = (typeof completions[todayKey] === 'number' ? completions[todayKey] : 0) as number;

      const currentPercentage = glassesToday / target;

      if (currentPercentage < requiredPercentage) {
        // User is behind schedule, send notification
        const subscriptionsSnapshot = await adminDb.collection('users').doc(userId).collection('pushSubscriptions').get();
        if (subscriptionsSnapshot.empty) continue;
        
        const payload = JSON.stringify({
          title: notificationTitle,
          body: `Your goal: ${target} glasses. You've had ${glassesToday}.`,
        });

        const sendPromises = subscriptionsSnapshot.docs.map(doc => {
          const sub = doc.data() as PushSubscription;
          return webpush.sendNotification(sub, payload).catch(error => {
            // If subscription is expired or invalid, delete it from Firestore.
            if (error.statusCode === 404 || error.statusCode === 410) {
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

    return NextResponse.json({ success: true, message: `Check complete. Sent ${notificationsSent} notifications.` });
  } catch (error) {
    console.error('Error in water check cron job:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
