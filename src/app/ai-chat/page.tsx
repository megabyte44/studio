
'use client';

import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, AlertTriangle, Database, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chat } from '@/ai/flows/chat';
import type { ChatMessage } from '@/types';
import { useToast } from "@/hooks/use-toast";
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

const LOCAL_STORAGE_KEY_CHATS = 'lifeos_ai_chats';
const DEFAULT_MESSAGE: Message = { id: '1', role: 'model', content: "Hello! How can I help you manage your life today?" };

export default function AiChatPage() {
  const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [includeData, setIncludeData] = useState(false);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const key = localStorage.getItem('google_api_key');
    setApiKey(key);
  }, []);

  useEffect(() => {
    try {
      const storedChats = localStorage.getItem(LOCAL_STORAGE_KEY_CHATS);
      if (storedChats) {
        const parsedChats = JSON.parse(storedChats);
        if (Array.isArray(parsedChats) && parsedChats.length > 0) {
          setMessages(parsedChats);
        }
      }
    } catch (e) {
      console.error("Failed to load chat history from local storage.", e);
      setMessages([DEFAULT_MESSAGE]);
    }
  }, []);

  useEffect(() => {
    // Avoid saving just the initial default message if there's no history.
    if (messages.length === 1 && messages[0].id === '1') {
      return;
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_CHATS, JSON.stringify(messages));
  }, [messages]);

  const scrollToBottom = () => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleNewChat = () => {
    setMessages([DEFAULT_MESSAGE]);
    localStorage.removeItem(LOCAL_STORAGE_KEY_CHATS);
    toast({
      title: "New Chat Started",
      description: "Your previous conversation has been cleared.",
    });
  };

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
    
    let userData: string | undefined = undefined;
    if (includeData) {
      try {
        const dataToInclude = {
            user: JSON.parse(localStorage.getItem('user') || '{}'),
            todos: JSON.parse(localStorage.getItem('lifeos_todos') || '[]'),
            transactions: JSON.parse(localStorage.getItem('lifeos_transactions') || '[]'),
            habits: JSON.parse(localStorage.getItem('lifeos_habits') || '[]'),
            notes: JSON.parse(localStorage.getItem('lifeos_notes') || '[]'),
            schedule: JSON.parse(localStorage.getItem('lifeos_weeklySchedule') || '{}'),
        };
        userData = JSON.stringify(dataToInclude, null, 2);
      } catch (e) {
        console.error("Failed to gather user data:", e);
        toast({
          variant: "destructive",
          title: "Could not load user data",
          description: "There was an error reading your app data from local storage.",
        });
      }
    }

    try {
      const aiResponse = await chat({
        history,
        message: userMessage.content,
        apiKey,
        userData,
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
        <div className="flex-shrink-0 border-b bg-background">
          <div className="max-w-4xl mx-auto p-2 flex justify-end items-center">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <PlusCircle className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will start a new chat and permanently delete your current conversation history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleNewChat}>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
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
                            <div className="w-full max-w-4xl rounded-xl p-3 text-sm shadow-md whitespace-pre-wrap bg-card border">
                              <MarkdownRenderer content={message.content} />
                            </div>
                          </div>
                        );
                    }
                    return (
                        <div key={message.id} className="flex items-start gap-4 justify-end">
                            <div className="max-w-3xl rounded-xl p-3 text-sm shadow-md whitespace-pre-wrap bg-primary text-primary-foreground">
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
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant={includeData ? "default" : "outline"}
                        size="icon"
                        onClick={() => setIncludeData(p => !p)}
                        disabled={isLoading || !apiKey}
                        aria-label="Toggle including user data"
                      >
                        <Database className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{includeData ? 'Stop including app data' : 'Include app data in conversation'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
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
