'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { verifyUser } from './actions';

const LOCAL_STORAGE_KEY_USER = 'user';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (localStorage.getItem(LOCAL_STORAGE_KEY_USER)) {
      router.replace('/dashboard');
    } else {
      setIsPageLoading(false);
    }
  }, [router]);

  const handleLogin = async () => {
    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      toast({
        variant: 'destructive',
        title: 'Username required',
        description: 'Please enter a username to log in.',
      });
      return;
    }
    
    setIsLoginLoading(true);

    try {
        const result = await verifyUser(trimmedUsername);

        if (result.success) {
            localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify({ username: trimmedUsername }));
            router.replace('/dashboard');
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: result.error || 'An unknown error occurred.',
            });
        }
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Login Error',
            description: 'Could not connect to the server. Please check your network connection.',
        });
        console.error("Login client-side error:", error);
    } finally {
        setIsLoginLoading(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleLogin();
      }
  }

  if (isPageLoading) {
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
              disabled={isLoginLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleLogin} disabled={isLoginLoading}>
            {isLoginLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoginLoading ? 'Verifying...' : 'Login'}
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
