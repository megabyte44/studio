'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogIn } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const WHITELIST_KEY = 'lifeos_whitelist';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Initialize the whitelist in localStorage if it doesn't exist.
    if (!localStorage.getItem(WHITELIST_KEY)) {
      localStorage.setItem(WHITELIST_KEY, JSON.stringify(['admin', 'punith']));
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username) {
      setError('Please provide a username.');
      return;
    }

    const whitelist = JSON.parse(localStorage.getItem(WHITELIST_KEY) || '[]');
    if (!whitelist.includes(username.toLowerCase().trim())) {
      setError('Access Denied. This user is not on the whitelist.');
      return;
    }

    localStorage.setItem('user', JSON.stringify({ username }));
    router.push('/dashboard');
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary p-4">
      <div className="absolute top-0 left-0 w-full h-full bg-background opacity-75"></div>
      <Card className="w-full max-w-sm z-10 shadow-2xl">
        <form onSubmit={handleLogin}>
          <CardHeader className="text-center">
            <h1 className="font-headline text-2xl font-bold text-primary">LifeOS</h1>
            <CardDescription>Your all-in-one productivity partner.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
               <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Login Failed</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="font-headline">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full font-headline">
              <LogIn className="mr-2 h-4 w-4" />
              Sign In
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
