'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // This effect runs once on component mount to handle the redirect result from Google.
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          // A result means the user has successfully signed in.
          // The onAuthStateChanged listener in AuthProvider will handle setting user state
          // and navigating to the dashboard. We can show a toast here for better UX.
          toast({ title: 'Sign-in successful!', description: 'Redirecting to your dashboard...' });
        }
      })
      .catch((error) => {
        console.error("Authentication Error during redirect:", error);
        toast({
          variant: 'destructive',
          title: 'Authentication Failed',
          description: 'Could not complete sign-in. Please try again.',
        });
      })
      .finally(() => {
        // Stop the redirect processing loader regardless of outcome.
        setIsProcessingRedirect(false);
      });
  }, [toast]);

  useEffect(() => {
    if (!authLoading && user) {
        router.replace('/dashboard');
    }
  }, [user, authLoading, router]);


  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithRedirect(auth, provider);
      // After this, the user is redirected to the Google sign-in page.
      // They will be redirected back to the app, where AuthProvider will handle the result.
    } catch (error: any) {
      console.error("Authentication Error:", error);
      let description = 'An unexpected error occurred. Please try again.';
      
      switch(error.code) {
        case 'auth/popup-closed-by-user':
          description = 'The sign-in window was closed before completing the sign-in. Please try again.';
          break;
        case 'auth/cancelled-popup-request':
          description = 'Multiple sign-in attempts were made. Please try again.';
          break;
        case 'auth/operation-not-allowed':
          description = 'Google Sign-In is not enabled for this project. Please enable it in the Firebase console.';
          break;
        case 'auth/invalid-credential':
             description = 'The credential used is malformed or has expired.';
             break;
        default:
          description = 'An unexpected error occurred during sign-in. Check the console for more details.';
          break;
      }
      
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: description,
      });
      setIsLoading(false); // Only stop loading if an error prevented the redirect
    }
  };

  // While we process the redirect result or auth state, show a loader.
  if (isProcessingRedirect || authLoading) {
    return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Finalizing sign-in...</p>
            </div>
        </main>
    );
  }

  // If we are done loading and there's no user, show the login button.
  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Welcome to LifeOS</CardTitle>
            <CardDescription>Sign in with your Google account to continue.</CardDescription>
          </CardHeader>
          <CardContent>
              {/* This space can be used for a separator or additional info if needed later */}
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                  <svg
                      role="img"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                      className="mr-2 h-4 w-4"
                  >
                      <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.08-2.58 2.03-4.56 2.03-3.86 0-7-3.14-7-7s3.14-7 7-7c1.74 0 3.32.67 4.54 1.8l2.45-2.3c-1.5-1.4-3.47-2.3-5.99-2.3-4.97 0-9 4.03-9 9s4.03 9 9 9c2.73 0 4.97-1.02 6.6-2.65 1.78-1.78 2.34-4.24 2.34-6.32 0-.46-.05-.88-.13-1.28h-9.13z"
                      fill="currentColor"
                      />
                  </svg>
              )}
              Sign in with Google
            </Button>
          </CardFooter>
        </Card>
      </main>
    );
  }

  // If the user is authenticated, we should be redirecting. Show a loader as a fallback.
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p>Redirecting...</p>
        </div>
    </main>
  );
}
