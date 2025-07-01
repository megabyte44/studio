'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink } from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [uiLoading, setUiLoading] = useState(true); // Start loading to handle link check
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // This effect runs once on mount to handle auth state and email links.
    if (!authLoading) {
      if (user) {
        router.replace('/dashboard');
        return; // Don't continue if user is already logged in
      }

      // If no user, check for an email sign-in link.
      if (isSignInWithEmailLink(auth, window.location.href)) {
        let emailFromStore = window.localStorage.getItem('emailForSignIn');
        if (!emailFromStore) {
          emailFromStore = window.prompt('Please provide your email for confirmation');
        }

        if (emailFromStore) {
          signInWithEmailLink(auth, emailFromStore, window.location.href)
            .then(() => {
              // Success! The AuthProvider will detect the change and redirect.
              window.localStorage.removeItem('emailForSignIn');
              if (window.history && window.history.replaceState) {
                  window.history.replaceState(null, '', window.location.pathname);
              }
            })
            .catch((error) => {
              toast({ variant: 'destructive', title: 'Sign-in Failed', description: 'The sign-in link is invalid or has expired.' });
              setUiLoading(false);
            });
        } else {
          // No email provided for link sign-in.
          setUiLoading(false);
        }
      } else {
        // Not a sign-in link and no user, so stop loading.
        setUiLoading(false);
      }
    }
  }, [user, authLoading, router, toast]);

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ variant: "destructive", title: "Email required", description: "Please enter your email address." });
      return;
    }
    setUiLoading(true);

    const actionCodeSettings = {
      // The URL to redirect to after the user clicks the email link.
      // The user will be sent back to this page to complete the sign-in.
      url: window.location.href,
      handleCodeInApp: true,
    };

    try {
      await sendSignInLinkToEmail(auth, email, actionCodeSettings);
      window.localStorage.setItem('emailForSignIn', email);
      setEmailSent(true);
      toast({ title: "Check your email", description: `A sign-in link has been sent to ${email}.` });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Error sending link", description: error.message });
    } finally {
      setUiLoading(false);
    }
  };
  
  // Show a loader while checking auth state or processing the link
  if (authLoading || uiLoading) {
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
          <CardDescription>
            {emailSent ? "Check your inbox!" : "Sign in with a magic link. No password required."}
          </CardDescription>
        </CardHeader>
        <CardContent>
            {emailSent ? (
                <div className="text-center">
                    <Mail className="mx-auto h-12 w-12 text-primary" />
                    <p className="mt-4 text-sm text-muted-foreground">
                        A sign-in link has been sent to <strong>{email}</strong>. Click the link in the email to sign in on this device.
                    </p>
                </div>
            ) : (
                <form onSubmit={handleSendLink}>
                    <div className="grid w-full items-center gap-4">
                        <div className="flex flex-col space-y-1.5">
                            <Label htmlFor="email">Email Address</Label>
                            <Input 
                                id="email" 
                                type="email"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={uiLoading}
                            />
                        </div>
                    </div>
                </form>
            )}
        </CardContent>
        {!emailSent && (
            <CardFooter>
                <Button className="w-full" onClick={handleSendLink} disabled={uiLoading}>
                    {uiLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Sign-In Link
                </Button>
            </CardFooter>
        )}
      </Card>
    </main>
  );
}
