
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If the AuthProvider has determined there's a user, redirect to the dashboard.
    if (!authLoading && user) {
      router.replace('/dashboard');
    }
  }, [user, authLoading, router]);

  // While the AuthProvider is determining the initial auth state, or if a user exists and we are redirecting, show a loader.
  if (authLoading || user) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Loading...</p>
            </div>
        </main>
    );
  }

  // If we're done loading and there's no user, show the login card.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome to LifeOS</CardTitle>
          <CardDescription>Sign-in is currently unavailable.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-center text-muted-foreground">Please contact support for assistance.</p>
        </CardContent>
      </Card>
    </main>
  );
}
