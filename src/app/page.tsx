'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // Check if a user session already exists in local storage.
    const storedUser = localStorage.getItem('user');

    if (storedUser) {
      // If a user is found, they are already "logged in". Redirect to the dashboard.
      router.replace('/dashboard');
    } else {
      // If no user is found, this is a "first-time login". 
      // Set a default user to bypass a login screen, and then redirect.
      localStorage.setItem('user', JSON.stringify({ username: 'Default User' }));
      router.replace('/dashboard');
    }
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p>Loading your session...</p>
      </div>
    </main>
  );
}
