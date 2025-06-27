
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LOCAL_STORAGE_KEY_USER = 'user';
const LOCAL_STORAGE_KEY_WHITELIST = 'lifeos_whitelist';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (localStorage.getItem(LOCAL_STORAGE_KEY_USER)) {
      router.replace('/dashboard');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogin = () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast({
        variant: 'destructive',
        title: 'Username required',
        description: 'Please enter a username to log in.',
      });
      return;
    }

    // Check against whitelist. By default, if no whitelist is set, only 'admin' can log in.
    let whitelist: string[] = ['admin'];
    const storedWhitelist = localStorage.getItem(LOCAL_STORAGE_KEY_WHITELIST);

    if (storedWhitelist) {
        try {
            const parsedWhitelist = JSON.parse(storedWhitelist);
            if (Array.isArray(parsedWhitelist) && parsedWhitelist.length > 0) {
                whitelist = parsedWhitelist;
            }
        } catch (e) {
            console.error("Failed to parse whitelist", e);
        }
    }
    
    if (!whitelist.includes(trimmedUsername.toLowerCase())) {
        toast({
            variant: 'destructive',
            title: 'Login Failed',
            description: 'This username is not authorized to access the application.',
        });
        return;
    }

    localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify({ username: trimmedUsername }));
    router.replace('/dashboard');
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleLogin();
      }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Welcome to LifeOS</CardTitle>
          <CardDescription>Enter your username to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="e.g., admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={handleKeyDown}
              required
              autoFocus
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin}>
            Login
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
