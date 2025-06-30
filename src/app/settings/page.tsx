
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dumbbell, ShieldCheck, Save, Download, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';

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
