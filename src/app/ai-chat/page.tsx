
'use client';

import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';

type Message = {
  id: string;
  role: 'user' | 'ai';
  content: string;
};

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', content: "Hello! How can I help you manage your life today?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    // This is a bit of a hack to get the viewport of the ScrollArea component
    // because it doesn't expose a ref to it directly.
    const viewport = scrollAreaRef.current?.querySelector('div[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Placeholder for AI response.
    // In a real app, you would make an API call here.
    setTimeout(() => {
      const aiResponse: Message = {
        id: `ai-${Date.now()}`,
        role: 'ai',
        content: `This is a placeholder response for: "${userMessage.content}". AI functionality is not yet implemented.`,
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col">
        <Card className="flex-1 flex flex-col max-h-[calc(100vh-12rem)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              AI Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
             <ScrollArea className="h-full p-4" ref={scrollAreaRef}>
                 <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex items-start gap-3',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}
                      >
                        {message.role === 'ai' && (
                          <Avatar className="h-8 w-8">
                             <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-5 w-5"/></AvatarFallback>
                          </Avatar>
                        )}
                        <div
                          className={cn(
                            'max-w-xs md:max-w-md lg:max-w-lg rounded-xl p-3 text-sm',
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          )}
                        >
                          {message.content}
                        </div>
                         {message.role === 'user' && (
                          <Avatar className="h-8 w-8">
                             <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                        <div className="flex items-start gap-3 justify-start">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-5 w-5"/></AvatarFallback>
                            </Avatar>
                             <div className="bg-muted rounded-xl p-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:0s]"></span>
                                    <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:0.15s]"></span>
                                    <span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:0.3s]"></span>
                                </div>
                            </div>
                        </div>
                    )}
                 </div>
             </ScrollArea>
          </CardContent>
          <CardFooter className="pt-4 border-t">
            <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
              <Input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything..."
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
