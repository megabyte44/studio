
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Mail, Smartphone, Users } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { auth } from '@/lib/firebase';
import { 
  sendSignInLinkToEmail, 
  isSignInWithEmailLink, 
  signInWithEmailLink,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInAnonymously,
  type ConfirmationResult
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

  // Phone state
  const [phoneNumber, setPhoneNumber] = useState('+91');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verifier, setVerifier] = useState<RecaptchaVerifier | null>(null);

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

  const setupRecaptcha = () => {
    if (verifier) return;

    try {
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'normal',
            'callback': (response: any) => {
                toast({ title: "reCAPTCHA solved!", description: "You can now send the OTP." });
            },
            'expired-callback': () => {
                toast({ variant: 'destructive', title: 'reCAPTCHA Expired', description: 'Please solve the reCAPTCHA again.' });
                setVerifier(null); 
            }
        });
        setVerifier(recaptchaVerifier);
    } catch (error) {
        console.error("reCAPTCHA setup error:", error);
        toast({ variant: "destructive", title: "reCAPTCHA Error", description: "Could not initialize reCAPTCHA. Please refresh the page." });
    }
  };
  
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
  
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || phoneNumber.trim().length < 11) { // Basic validation
      toast({ variant: "destructive", title: "Invalid Phone Number", description: "Please enter a valid phone number with country code." });
      return;
    }
     if (!verifier) {
        toast({ variant: 'destructive', title: 'reCAPTCHA Not Ready', description: 'Please complete the reCAPTCHA challenge first.' });
        return;
    }
    setUiLoading(true);
    
    try {
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      toast({ title: "OTP Sent", description: `An OTP has been sent to ${phoneNumber}.` });
    } catch (error: any) {
      console.error(error);
      toast({ variant: "destructive", title: "Failed to send OTP", description: "Please check your phone number and that the reCAPTCHA is solved." });
    } finally {
      setUiLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.length !== 6) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "Please enter the 6-digit OTP." });
      return;
    }
    if (!confirmationResult) {
       toast({ variant: "destructive", title: "Error", description: "OTP could not be verified. Please try again." });
       return;
    }

    setUiLoading(true);
    try {
      await confirmationResult.confirm(otp);
      toast({ title: "Success!", description: "You have been signed in." });
    } catch (error: any) {
      console.error(error);
      let description = "The OTP could not be verified. Please try again.";
      if (error.code === 'auth/invalid-verification-code') {
        description = "The OTP you entered is incorrect. Please double-check and try again.";
      } else if (error.code === 'auth/code-expired') {
        description = "The OTP has expired. Please request a new one by going back.";
      }
      toast({ variant: "destructive", title: "Sign-in Failed", description });
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

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    if (value.startsWith('+91')) {
      const numericPart = value.substring(3).replace(/[^0-9]/g, '');
      setPhoneNumber(`+91${numericPart}`);
    } else {
      setPhoneNumber('+91');
    }
  };

  if (authLoading || (uiLoading && !otpSent && !emailSent)) {
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
           <Tabs defaultValue="email" className="w-full" onValueChange={(value) => { if (value === 'phone') { setupRecaptcha() }}}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="email"><Mail className="mr-2 h-4 w-4"/>Email</TabsTrigger>
                <TabsTrigger value="phone"><Smartphone className="mr-2 h-4 w-4"/>Phone</TabsTrigger>
                <TabsTrigger value="guest"><Users className="mr-2 h-4 w-4"/>Guest</TabsTrigger>
              </TabsList>
              
              <TabsContent value="email" className="pt-4">
                  {emailSent ? (
                      <div className="text-center">
                          <Mail className="mx-auto h-12 w-12 text-primary" />
                          <p className="mt-4 text-sm text-muted-foreground">
                              A sign-in link has been sent to <strong>{email}</strong>. Click the link in the email to sign in.
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
              
              <TabsContent value="phone" className="pt-4">
                {!otpSent ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input id="phone" type="tel" placeholder="+91 123 456 7890" value={phoneNumber} onChange={handlePhoneInputChange} disabled={uiLoading}/>
                                <p className="text-xs text-muted-foreground">Currently supporting Indian phone numbers.</p>
                            </div>
                            <div id="recaptcha-container" className="flex justify-center"></div>
                            <Button className="w-full" type="submit" disabled={uiLoading}>
                                {uiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Send OTP"}
                            </Button>
                        </div>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp}>
                        <div className="grid w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5">
                                <Label htmlFor="otp">One-Time Password (OTP)</Label>
                                <Input id="otp" type="text" inputMode="numeric" pattern="d{6}" maxLength={6} placeholder="Enter 6-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={uiLoading}/>
                            </div>
                            <Button className="w-full" type="submit" disabled={uiLoading}>
                                {uiLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify & Sign In"}
                            </Button>
                             <Button variant="link" size="sm" onClick={() => { setOtpSent(false); setOtp(''); setConfirmationResult(null); }} disabled={uiLoading}>
                                Back to phone number entry
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
