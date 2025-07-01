
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
  // Local loading state for the sign-in button click
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Global auth state from our provider
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    // If the AuthProvider has determined there's a user, we should redirect.
    // This handles cases where the user is already logged in or has just been authenticated.
    if (!authLoading && user) {
      router.replace('/dashboard');
      return;
    }

    // If the AuthProvider is done loading and there's still no user,
    // we then check if this page load is the result of a sign-in redirect.
    if (!authLoading && !user) {
      getRedirectResult(auth)
        .then((result) => {
          if (result) {
            // This means a sign-in just completed.
            // The `onAuthStateChanged` listener in AuthProvider will now have the user,
            // and on the next render, the check above will redirect to the dashboard.
            toast({ title: 'Sign-in successful!', description: 'Redirecting to your dashboard...' });
          }
        })
        .catch((error) => {
          console.error("Authentication Error during redirect:", error);
          // Handle specific errors for better user feedback
          let description = 'An unexpected error occurred. Please try again.';
          switch (error.code) {
            case 'auth/account-exists-with-different-credential':
              description = 'An account already exists with the same email address but different sign-in credentials. Please sign in using the original method.';
              break;
            case 'auth/auth-domain-config-required':
              description = 'The authentication domain is not configured. Please check your Firebase project settings.';
              break;
            case 'auth/operation-not-allowed':
              description = 'Google Sign-In is not enabled for this project. Please enable it in the Firebase console.';
              break;
            default:
              description = `An error occurred during sign-in: ${error.message}`;
              break;
          }
          toast({
            variant: 'destructive',
            title: 'Authentication Failed',
            description,
          });
        });
    }
  }, [user, authLoading, router, toast]);


  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // The user is redirected from here. isSigningIn will reset on page reload.
    } catch (error: any) {
      console.error("Authentication Error:", error);
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: 'Could not start the sign-in process. Please try again.',
      });
      setIsSigningIn(false);
    }
  };

  // While the AuthProvider is determining the initial auth state, show a loader.
  // Or if we know there is a user, it means we are in the process of redirecting.
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

  // If we're done loading and there's no user, show the login button.
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
          <Button className="w-full" onClick={handleGoogleSignIn} disabled={isSigningIn}>
            {isSigningIn ? (
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
