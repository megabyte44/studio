
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dumbbell } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const LOCAL_STORAGE_KEY_FEATURES = 'lifeos_feature_settings';

export default function SettingsPage() {
  const [gymTrackingEnabled, setGymTrackingEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(LOCAL_STORAGE_KEY_FEATURES);
      if (storedSettings) {
        const settings = JSON.parse(storedSettings);
        setGymTrackingEnabled(settings.gymTracking !== false); // Default to true if property is missing
      }
    } catch (e) {
      console.error("Failed to load feature settings", e);
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
      
      // Dispatch a storage event to notify other open tabs/components
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
        <div className="space-y-4">
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
      </div>
    </AppLayout>
  );
}
