
import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, User, Loader2, Send, Sparkles } from 'lucide-react';
import { chat } from '@/ai/flows/chat';
import type { ChatInput, ChatMessage } from '@/types';
import { cn } from '@/lib/utils';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

async function getUserContextData(userId: string): Promise<string> {
    try {
        const collectionsToFetch = ['todos', 'transactions', 'habits', 'notes'];
        let contextData: Record<string, any> = {};

        for (const collection of collectionsToFetch) {
            const docRef = doc(db, 'users', userId, 'data', collection);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                contextData[collection] = (docSnap.data() as {items: any}).items;
            }
        }
        // Abridged version of data for brevity in prompt
        const abridgedData = {
            todos: contextData.todos?.slice(0, 5).map((t: any) => t.text),
            recent_transactions: contextData.transactions?.slice(0, 5).map((t: any) => t.description),
            habits: contextData.habits?.map((h: any) => h.name),
            note_titles: contextData.notes?.slice(0, 5).map((n: any) => n.title),
        };

        return JSON.stringify(abridgedData, null, 2);
    } catch (error) {
        console.error("Error fetching user data for AI context:", error);
        return "Could not fetch user data.";
    }
}


export default function AiChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [includeData, setIncludeData] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  };
  
  useEffect(scrollToBottom, [messages]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        let userData: string | undefined = undefined;
        if (includeData) {
            userData = await getUserContextData(user.uid);
        }

        const chatInput: ChatInput = {
            history: messages.filter(m => m.role === 'user' || m.role === 'model'),
            message: input,
            userData,
        };

        const response = await chat(chatInput);

        const modelMessage: ChatMessage = { role: 'model', content: response.content };
        setMessages((prev) => [...prev, modelMessage]);

    } catch (error) {
        console.error(error);
        const errorMessage: ChatMessage = {
            role: 'model',
            content: 'Sorry, I encountered an error. Please check your API key and try again.',
        };
        setMessages((prev) => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <Card className="flex flex-col h-[calc(100vh-8rem)]">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline">AI Assistant</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id="include-data" checked={includeData} onCheckedChange={(checked) => setIncludeData(!!checked)} />
            <Label htmlFor="include-data" className="text-sm font-medium">Include App Data</Label>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-hidden p-0">
            <ScrollArea className="h-full" viewportRef={scrollAreaRef}>
                <div className="p-4 space-y-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground pt-16">
                            <Sparkles className="h-12 w-12 mb-4" />
                            <h2 className="text-xl font-semibold">Start a conversation</h2>
                            <p>Ask me anything about your schedule, finances, or tasks.</p>
                        </div>
                    )}
                    {messages.map((message, index) => (
                      <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : '')}>
                        {message.role === 'model' && <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback></Avatar>}
                        <div className={cn('max-w-md rounded-lg p-3 text-sm', message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted')}>
                           <MarkdownRenderer content={message.content} />
                        </div>
                        {message.role === 'user' && <Avatar className="h-8 w-8"><AvatarFallback><User className="h-5 w-5"/></AvatarFallback></Avatar>}
                      </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8"><AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback></Avatar>
                            <div className="max-w-md rounded-lg p-3 bg-muted">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full items-center space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question..."
              disabled={isLoading}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
              <span className="sr-only">Send</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </AppLayout>
  );
}