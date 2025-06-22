
import { AppLayout } from '@/components/layout/AppLayout';

export default function SettingsPage() {
  return (
    <AppLayout>
        <div className="space-y-4">
            <header>
              <h1 className="text-2xl font-bold font-headline">Settings</h1>
              <p className="text-muted-foreground">Manage your application settings here.</p>
            </header>
            <div className="flex justify-center items-center h-64 border rounded-lg bg-muted/40">
                <p className="text-muted-foreground">Application settings will be here.</p>
            </div>
      </div>
    </AppLayout>
  );
}
