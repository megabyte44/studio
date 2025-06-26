'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // To bypass login, we'll set a default user and redirect to the dashboard.
    // This allows the app to function as if a user is logged in.
    localStorage.setItem('user', JSON.stringify({ username: 'Default User' }));
    router.replace('/dashboard');
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Loading your dashboard...</p>
      </div>
    </main>
  );
}
