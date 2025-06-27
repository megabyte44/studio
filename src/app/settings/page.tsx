'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dumbbell, ShieldCheck, Save } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from "@/hooks/use-toast";

const LOCAL_STORAGE_KEY_FEATURES = 'lifeos_feature_settings';
const LOCAL_STORAGE_KEY_API_KEY = 'google_api_key';

function ApiKeyManager() {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem(LOCAL_STORAGE_KEY_API_KEY);
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    localStorage.setItem(LOCAL_STORAGE_KEY_API_KEY, apiKey);
    toast({
      title: "API Key Saved",
      description: "Your Google AI API key has been updated.",
    });
  };

  if (isLoading) {
      return (
          <Card>
              <CardHeader>
                  <Skeleton className="h-6 w-1/4 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                  <Skeleton className="h-10 w-full" />
              </CardContent>
              <CardFooter>
                  <Skeleton className="h-10 w-24" />
              </CardFooter>
          </Card>
      );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5" />
          AI API Key Management
        </CardTitle>
        <CardDescription>
          Provide your Google AI API key to enable generative AI features. Your key is stored locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Label htmlFor="api-key-input">Google AI API Key</Label>
          <Input
            id="api-key-input"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your API key here"
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" /> Save Key
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function SettingsPage() {
  const [gymTrackingEnabled, setGymTrackingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_FEATURES);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setGymTrackingEnabled(settings.gymTracking !== false);
      }
    } catch (e) {
      console.error("Failed to load settings", e);
    }
    setIsLoading(false);
  }, []);

  const handleToggleGymTracking = (enabled: boolean) => {
    setGymTrackingEnabled(enabled);
    try {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_FEATURES);
      const settings = storedSettings ? JSON.parse(storedSettings) : {};
      settings.gymTracking = enabled;
      localStorage.setItem(LOCAL_STORAGE_KEY_FEATURES, JSON.stringify(settings));
      
      window.dispatchEvent(new StorageEvent('storage', { 
        key: LOCAL_STORAGE_KEY_FEATURES,
        newValue: JSON.stringify(settings),
        storageArea: localStorage,
      }));
    } catch (e) {
      console.error("Failed to save feature settings", e);
    }
  };

  return (
    <AppLayout>
        <div className="space-y-6">
            <header>
              <h1 className="text-2xl font-bold font-headline">Settings</h1>
              <p className="text-muted-foreground">Manage your application settings here.</p>
            </header>
            
            <Card>
                <CardHeader>
                    <CardTitle>Feature Management</CardTitle>
                    <CardDescription>Enable or disable optional features to customize your experience.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <Skeleton className="h-20 w-full" />
                    ) : (
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                                <Label htmlFor="gym-tracking-switch" className="text-base flex items-center gap-2">
                                    <Dumbbell className="h-5 w-5" />
                                    Gym & Fitness Tracking
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Show trackers for workouts, protein, and overload.
                                </p>
                            </div>
                            <Switch
                                id="gym-tracking-switch"
                                checked={gymTrackingEnabled}
                                onCheckedChange={handleToggleGymTracking}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <ApiKeyManager />

      </div>
    </AppLayout>
  );
}
