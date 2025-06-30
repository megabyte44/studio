
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dumbbell, ShieldCheck, Save, Download, Upload, BellDot } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

function BackupAndRestore() {
    const { user } = useAuth();
    const { toast } = useToast();

    const handleBackup = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to back up data.' });
            return;
        }
        try {
            const dataCollections = ['budget', 'habits', 'notes', 'notifications', 'passwords', 'todos', 'transactions', 'weeklySchedule', 'ai_chats'];
            const backupData: Record<string, any> = {};
            
            for (const coll of dataCollections) {
                const docRef = doc(db, 'users', user.uid, 'data', coll);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    backupData[coll] = docSnap.data();
                }
            }
            
            const userDocRef = doc(db, 'users', user.uid);
            const userDocSnap = await getDoc(userDocRef);
            if(userDocSnap.exists()) {
                backupData['userProfile'] = userDocSnap.data();
            }

            const json = JSON.stringify(backupData, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lifeos_backup_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
            toast({ title: 'Success', description: 'Your data has been downloaded.' });
        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Backup Failed', description: 'Could not back up your data.' });
        }
    };

    const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to restore data.' });
            return;
        }
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const json = e.target?.result as string;
                const backupData = JSON.parse(json);

                for (const [coll, data] of Object.entries(backupData)) {
                    if (coll === 'userProfile') {
                         await setDoc(doc(db, 'users', user.uid), data, { merge: true });
                    } else {
                         await setDoc(doc(db, 'users', user.uid, 'data', coll), data);
                    }
                }
                toast({ title: 'Success', description: 'Your data has been restored. The page will now reload.' });
                setTimeout(() => window.location.reload(), 2000);
            } catch (error) {
                console.error(error);
                toast({ variant: 'destructive', title: 'Restore Failed', description: 'The backup file is invalid or corrupt.' });
            }
        };
        reader.readAsText(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Backup & Restore</CardTitle>
                <CardDescription>Download all your data to a file or restore from a previous backup.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Button onClick={handleBackup} className="w-full sm:w-auto"><Download className="mr-2 h-4 w-4" />Download Backup</Button>
                <div className="relative w-full sm:w-auto">
                    <Button className="w-full pointer-events-none"><Upload className="mr-2 h-4 w-4" />Restore from Backup</Button>
                    <Input type="file" accept=".json" onChange={handleRestore} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>
            </CardContent>
        </Card>
    );
}

function PushNotificationManager() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [isSupported, setIsSupported] = useState(false);
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
            setIsSupported(true);
            setIsPermissionGranted(Notification.permission === 'granted');
        } else {
            setIsSupported(false);
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const checkSubscription = async () => {
            if (isSupported) {
                const registration = await navigator.serviceWorker.ready;
                const subscription = await registration.pushManager.getSubscription();
                setIsSubscribed(!!subscription);
                setIsLoading(false);
            }
        };
        if(isSupported) {
            checkSubscription();
        }
    }, [isSupported]);
    
    const urlBase64ToUint8Array = (base64String: string) => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    };

    const subscribeUser = async () => {
        if (!user || !isSupported || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            if(!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
                 toast({ variant: 'destructive', title: 'Setup Incomplete', description: 'VAPID public key is not configured.' });
            }
            return;
        }
        
        if (Notification.permission === 'denied') {
            toast({ variant: 'destructive', title: 'Permission Denied', description: 'Please enable notifications in your browser settings.' });
            return;
        }
        
        setIsLoading(true);

        try {
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();
            
            if (!subscription) {
                const applicationServerKey = urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey,
                });
            }

            const token = await user.getIdToken();
            await fetch('/api/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(subscription),
            });
            
            setIsSubscribed(true);
            setIsPermissionGranted(true);
            toast({ title: 'Subscribed!', description: 'You will now receive push notifications.' });

        } catch (error) {
            console.error('Failed to subscribe:', error);
            toast({ variant: 'destructive', title: 'Subscription Failed', description: 'Could not enable push notifications.' });
        } finally {
            setIsLoading(false);
        }
    };
    
    const unsubscribeUser = async () => {
        if (!user || !isSupported) return;

        setIsLoading(true);
        try {
            const registration = await navigator.serviceWorker.ready;
            const subscription = await registration.pushManager.getSubscription();
            
            if (subscription) {
                await subscription.unsubscribe();
                const token = await user.getIdToken();
                await fetch('/api/push/unsubscribe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ endpoint: subscription.endpoint }),
                });
            }
            
            setIsSubscribed(false);
            toast({ title: 'Unsubscribed', description: 'Push notifications have been disabled.' });

        } catch (error) {
            console.error('Failed to unsubscribe:', error);
             toast({ variant: 'destructive', title: 'Failed to Unsubscribe', description: 'Could not disable push notifications.' });
        } finally {
            setIsLoading(false);
        }
    }
    
    const handleSendTest = async () => {
        if (!user) return;
        toast({ title: 'Sending...', description: 'Sending a test notification to your device.' });
        try {
            const token = await user.getIdToken();
            const res = await fetch('/api/push/send-test', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if(!res.ok) throw new Error("Failed to send test notification");
            toast({ title: 'Test Sent!', description: 'Check your device for a notification.' });
        } catch(e) {
             toast({ variant: 'destructive', title: 'Failed to Send', description: 'Could not send test notification.' });
        }
    }

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BellDot />Push Notifications</CardTitle>
                    <CardDescription>Receive reminders even when the app is closed.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-destructive">Your browser does not support push notifications.</p>
                </CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><BellDot />Push Notifications</CardTitle>
                <CardDescription>Receive reminders even when the app is closed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                        <Label htmlFor="push-switch" className="text-base">Enable Notifications</Label>
                        <p className="text-sm text-muted-foreground">
                            { isSubscribed ? "Notifications are enabled on this device." : "Allow notifications to stay updated."}
                        </p>
                    </div>
                    <Switch id="push-switch" checked={isSubscribed} onCheckedChange={isSubscribed ? unsubscribeUser : subscribeUser} disabled={isLoading} />
                </div>
                {!isPermissionGranted && !isSubscribed && (
                    <p className="text-xs text-amber-600">Note: Your browser will prompt you for permission.</p>
                )}
            </CardContent>
            {isSubscribed && (
                <CardFooter>
                    <Button onClick={handleSendTest} variant="secondary">
                        Send Test Notification
                    </Button>
                </CardFooter>
            )}
        </Card>
    )
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [gymTrackingEnabled, setGymTrackingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const settingsDocRef = doc(db, 'users', user.uid, 'data', 'settings');
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const settings = (docSnap.data() as {items: any}).items;
            setGymTrackingEnabled(settings.gymTracking !== false);
        }
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleToggleGymTracking = async (enabled: boolean) => {
    if (!user) return;
    setGymTrackingEnabled(enabled);
    const settingsDocRef = doc(db, 'users', user.uid, 'data', 'settings');
    await setDoc(settingsDocRef, { items: { gymTracking: enabled } });
  };

  return (
    <AppLayout>
        <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold font-headline">Settings</h1>
              <p className="text-muted-foreground">Manage your application settings here.</p>
            </header>
            
            <Card>
                <CardHeader><CardTitle>Feature Management</CardTitle><CardDescription>Enable or disable optional features to customize your experience.</CardDescription></CardHeader>
                <CardContent>
                    {isLoading ? ( <Skeleton className="h-20 w-full" /> ) : (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="gym-tracking-switch" className="text-base flex items-center gap-2"><Dumbbell className="h-5 w-5" />Gym & Fitness Tracking</Label>
                                <p className="text-sm text-muted-foreground">Show trackers for workouts, protein, and overload.</p>
                            </div>
                            <Switch id="gym-tracking-switch" checked={gymTrackingEnabled} onCheckedChange={handleToggleGymTracking} />
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <PushNotificationManager />

            <BackupAndRestore />
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5" />AI API Key Management</CardTitle>
                    <CardDescription>The application is now configured to use a secure, server-side API key. No action is needed from you.</CardDescription>
                </CardHeader>
            </Card>
      </div>
    </AppLayout>
  );
}
