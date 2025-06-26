
'use client';

import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chat } from '@/ai/flows/chat';
import type { ChatMessage } from '@/types';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: "Hello! How can I help you manage your life today?" },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const key = localStorage.getItem('google_api_key');
    setApiKey(key);
  }, []);

  const scrollToBottom = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    if (!apiKey) {
      toast({
        variant: "destructive",
        title: "API Key Missing",
        description: (
          <p>
            Please set your Google AI API key in the{' '}
            <Link href="/settings" className="underline">settings page</Link>.
          </p>
        ),
      });
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const history: ChatMessage[] = newMessages
      .slice(0, -1)
      .map(({ role, content }) => ({ role, content }));

    try {
      const aiResponse = await chat({
        history,
        message: userMessage.content,
        apiKey,
      });

      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'model',
        content: aiResponse.content,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessageContent = error instanceof Error ? error.message : "Failed to get response from AI.";
      
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `Sorry, something went wrong. Please check your API key and network connection. \n\n**Error:** ${errorMessageContent}`,
      };
      setMessages(prev => [...prev, errorMessage]);

      toast({
        variant: "destructive",
        title: "An error occurred",
        description: errorMessageContent,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="absolute inset-x-0 top-14 bottom-16 flex flex-col bg-background">
        <ScrollArea className="flex-1" viewportRef={viewportRef}>
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {!apiKey && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>API Key Not Set</AlertTitle>
                      <AlertDescription>
                        The AI chat is disabled. Please{' '}
                        <Link href="/settings" className="font-bold underline">
                          set your Google AI API key
                        </Link>{' '}
                        in the settings to enable it.
                      </AlertDescription>
                    </Alert>
                )}
                {messages.map((message) => {
                    if (message.role === 'model') {
                        return (
                          <div key={message.id} className="flex flex-col items-start gap-2">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-5 w-5"/></AvatarFallback>
                            </Avatar>
                            <div className="max-w-md rounded-xl p-3 text-sm shadow-md whitespace-pre-wrap bg-card border">
                              <MarkdownRenderer content={message.content} />
                            </div>
                          </div>
                        );
                    }
                    return (
                        <div key={message.id} className="flex items-start gap-4 justify-end">
                            <div className="max-w-md rounded-xl p-3 text-sm shadow-md whitespace-pre-wrap bg-primary text-primary-foreground">
                                {message.content}
                            </div>
                            <Avatar className="h-9 w-9">
                                <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                            </Avatar>
                        </div>
                    );
                })}

                {isLoading && (
                    <div className="flex flex-col items-start gap-2">
                        <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-5 w-5"/></AvatarFallback>
                        </Avatar>
                         <div className="bg-card border rounded-xl p-3 text-sm shadow-md">
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
        
        <div className="p-4 border-t bg-background">
          <div className="max-w-4xl mx-auto">
              <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
                <Input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  disabled={isLoading || !apiKey}
                  className="flex-1"
                />
                <Button type="submit" size="icon" disabled={isLoading || !input.trim() || !apiKey}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
