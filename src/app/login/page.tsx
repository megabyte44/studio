
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    const provider = new GoogleAuthProvider();

    try {
      await signInWithPopup(auth, provider);
      router.replace('/dashboard');
    } catch (error: any) {
      console.error("Authentication Error:", error); // Log the full error object for debugging
      let description = 'An unexpected error occurred. Please try again.';
      
      // Provide more specific feedback based on the error code
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
          // For other errors, you might want to show a generic message but log the specific error
          description = 'An unexpected error occurred during sign-in. Check the console for more details.';
          break;
      }
      
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: description,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
