
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  signInAnonymously,
} from 'firebase/auth';
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function LoginPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Common state
  const [uiLoading, setUiLoading] = useState(true);
  
  // Email state
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    // This effect runs once on mount to handle auth state and email links.
    if (!authLoading) {
      if (user) {
        router.replace('/dashboard');
        return; 
      }

      if (isSignInWithEmailLink(auth, window.location.href)) {
        let emailFromStore = window.localStorage.getItem('emailForSignIn');
        if (!emailFromStore) {
          emailFromStore = window.prompt('Please provide your email for confirmation');
        }

        if (emailFromStore) {
          signInWithEmailLink(auth, emailFromStore, window.location.href)
            .then(() => {
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
          setUiLoading(false);
        }
      } else {
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
      url: window.location.origin + '/login', 
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

  const handleAnonymousSignIn = async () => {
    setUiLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: 'Welcome!', description: 'You are signed in as a guest.' });
    } catch (error) {
      console.error("Anonymous sign-in failed", error);
      toast({ variant: "destructive", title: "Guest Sign-in Failed", description: "Could not sign you in as a guest. Please try again." });
      setUiLoading(false);
    }
  }

  if (authLoading || (uiLoading && !emailSent)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome to LifeOS</CardTitle>
          <CardDescription>
            Sign in or continue as a guest. No password required.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4"/>Email</TabsTrigger>
                <TabsTrigger value="guest"><Users className="mr-2 h-4 w-4"/>Guest</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="pt-4">
                  {emailSent ? (
                      <div className="text-center p-4">
                          <Mail className="mx-auto h-12 w-12 text-primary" />
                          <h3 className="mt-4 font-semibold">Check your inbox!</h3>
                          <p className="mt-2 text-sm text-muted-foreground">
                              A sign-in link has been sent to <strong>{email}</strong> from a no-reply address. If you don't see it, please check your spam folder.
                          </p>
                      </div>
                  ) : (
                      <form onSubmit={handleSendLink}>
                          <div className="grid w-full items-center gap-4">
                              <div className="flex flex-col space-y-1.5">
                                  <Label htmlFor="email">Email Address</Label>
                                  <Input id="email" type="email" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} disabled={uiLoading}/>
                              </div>
                              <Button className="w-full" type="submit" disabled={uiLoading}>
                                  {uiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send Sign-In Link"}
                              </Button>
                          </div>
                      </form>
                  )}
              </TabsContent>
              
              <TabsContent value="guest" className="pt-4">
                 <div className="text-center text-sm text-muted-foreground mb-4">
                    <p>Continue without an account. Your data will be stored on this device and will be lost if you log out or clear your browser data.</p>
                 </div>
                 <Button className="w-full" onClick={handleAnonymousSignIn} disabled={uiLoading}>
                    {uiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Continue as Guest"}
                 </Button>
              </TabsContent>
           </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
