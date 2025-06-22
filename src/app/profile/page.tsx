
import { AppLayout } from '@/components/layout/AppLayout';

export default function ProfilePage() {
  return (
    <AppLayout>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold font-headline">Edit Profile</h1>
          <p className="text-muted-foreground">Manage your profile settings here.</p>
        </header>
        <div className="flex justify-center items-center h-64 border rounded-lg bg-muted/40">
            <p className="text-muted-foreground">Profile settings form will be here.</p>
        </div>
      </div>
    </AppLayout>
  );
}
