
import { AppLayout } from '@/components/layout/AppLayout';

export default function PasswordManagerPage() {
  return (
    <AppLayout>
       <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold font-headline">Password Manager</h1>
          <p className="text-muted-foreground">Your encrypted password vault.</p>
        </header>
        <div className="flex justify-center items-center h-64 border rounded-lg bg-muted/40">
            <p className="text-muted-foreground">Password manager interface will be here.</p>
        </div>
      </div>
    </AppLayout>
  );
}
