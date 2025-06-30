
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

export default function ProfilePage() {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUsername(docSnap.data().username || '');
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    const userDocRef = doc(db, 'users', user.uid);
    await setDoc(userDocRef, { username: username.trim() }, { merge: true });
  };
  
  if (isLoading || !user) {
    return (
        <AppLayout>
            <div className="space-y-4">
                <header>
                  <h1 className="text-2xl font-bold font-headline">Edit Profile</h1>
                  <p className="text-muted-foreground">Manage your profile settings here.</p>
                </header>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                           <Skeleton className="h-20 w-20 rounded-full" />
                           <div className="space-y-2"><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-32" /></div>
                        </div>
                        <div className="space-y-2"><Skeleton className="h-4 w-1/6 mb-2" /><Skeleton className="h-10 w-full" /></div>
                    </CardContent>
                    <CardFooter><Skeleton className="h-10 w-24" /></CardFooter>
                </Card>
            </div>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold font-headline">Edit Profile</h1>
          <p className="text-muted-foreground">Manage your profile settings here.</p>
        </header>
        <Card>
            <CardHeader><CardTitle>Your Information</CardTitle><CardDescription>Update your username.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Your Avatar</Label>
                    <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                            <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="profile silhouette" />
                            <AvatarFallback>{username ? username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                        </Avatar>
                        <p className="text-sm text-muted-foreground">This is your display picture.</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
            </CardContent>
            <CardFooter><Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button></CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
