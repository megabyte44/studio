
'use client';

import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Save, Loader2, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setIsLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUsername(data.username || '');
        setPhotoURL(data.photoURL || null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleSave = async () => {
    if (!user || !username.trim()) return;
    setIsLoading(true);
    const userDocRef = doc(db, 'users', user.uid);
    try {
        await setDoc(userDocRef, { username: username.trim() }, { merge: true });
        toast({ title: "Success", description: "Your username has been updated." });
    } catch(e) {
        toast({ variant: 'destructive', title: "Error", description: "Could not save your username." });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const storageRef = ref(storage, `profile-pictures/${user.uid}`);
    
    try {
        await uploadBytes(storageRef, file);
        const newPhotoURL = await getDownloadURL(storageRef);
        
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(userDocRef, { photoURL: newPhotoURL }, { merge: true });
        
        setPhotoURL(newPhotoURL);
        toast({ title: 'Success!', description: 'Your profile picture has been updated.' });
    } catch (error) {
        console.error("Error uploading image:", error);
        toast({ variant: 'destructive', title: 'Upload Failed', description: 'Could not upload your image. Please try again.' });
    } finally {
        setIsUploading(false);
    }
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
            <CardHeader><CardTitle>Your Information</CardTitle><CardDescription>Update your username and profile picture.</CardDescription></CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Your Avatar</Label>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Avatar className="h-20 w-20">
                                <AvatarImage src={photoURL || undefined} alt="User Avatar" />
                                <AvatarFallback>{username ? username.charAt(0).toUpperCase() : 'U'}</AvatarFallback>
                            </Avatar>
                            <Button onClick={() => fileInputRef.current?.click()} disabled={isUploading} variant="secondary" size="icon" className="absolute bottom-0 right-0 h-7 w-7 rounded-full">
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Edit className="h-4 w-4" />}
                            </Button>
                            <Input 
                                type="file" 
                                ref={fileInputRef} 
                                onChange={handleImageUpload}
                                hidden 
                                accept="image/png, image/jpeg" 
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">Click the edit icon on your avatar to upload a new image.<br/>(Max 1MB)</p>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={isLoading} />
                </div>
            </CardContent>
            <CardFooter><Button onClick={handleSave} disabled={isLoading}><Save className="mr-2 h-4 w-4" /> Save Changes</Button></CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
