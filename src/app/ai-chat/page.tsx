
import { AppLayout } from '@/components/layout/AppLayout';

export default function AiChatPage() {
  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center h-full text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">AI Chat Disabled</h1>
          <p className="text-muted-foreground">This feature has been temporarily disabled to improve application stability.</p>
      </div>
    </AppLayout>
  );
}
