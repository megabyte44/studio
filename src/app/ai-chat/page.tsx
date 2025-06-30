
'use client';

import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Bot, User, AlertTriangle, Database, PlusCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { chat } from '@/ai/flows/chat';
import type { ChatMessage, Transaction, TodoItem, Habit, Note } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger, } from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';


type Message = {
  id: string;
  role: 'user' | 'model';
  content: string;
};

const DEFAULT_MESSAGE: Message = { id: '1', role: 'model', content: "Hello! How can I help you manage your life today?" };

export default function AiChatPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([DEFAULT_MESSAGE]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [includeData, setIncludeData] = useState(false);
  
  const viewportRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
        setIsHistoryLoading(false);
        return;
    }
    const chatDocRef = doc(db, 'users', user.uid, 'data', 'ai_chats');
    const unsubscribe = onSnapshot(chatDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const chatData = (docSnap.data() as {items: Message[]}).items;
            setMessages(chatData.length > 0 ? chatData : [DEFAULT_MESSAGE]);
        } else {
            setMessages([DEFAULT_MESSAGE]);
        }
        setIsHistoryLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const saveChatHistory = async (newMessages: Message[]) => {
      if (!user) return;
      const chatDocRef = doc(db, 'users', user.uid, 'data', 'ai_chats');
      await setDoc(chatDocRef, { items: newMessages });
  }

  useEffect(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({ top: viewportRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isChatLoading]);

  const handleNewChat = () => {
    setMessages([DEFAULT_MESSAGE]);
    saveChatHistory([]);
    toast({ title: "New Chat Started", description: "Your previous conversation has been cleared." });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isChatLoading || !user) return;

    const userMessage: Message = { id: `user-${Date.now()}`, role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsChatLoading(true);

    const history: ChatMessage[] = newMessages.slice(0, -1).map(({ role, content }) => ({ role, content }));
    
    let userData: string | undefined = undefined;
    if (includeData) {
      try {
        const [userProfile, todos, transactions, habits, notes, schedule] = await Promise.all([
            getDoc(doc(db, 'users', user.uid)),
            getDoc(doc(db, 'users', user.uid, 'data', 'todos')),
            getDoc(doc(db, 'users', user.uid, 'data', 'transactions')),
            getDoc(doc(db, 'users', user.uid, 'data', 'habits')),
            getDoc(doc(db, 'users', user.uid, 'data', 'notes')),
            getDoc(doc(db, 'users', user.uid, 'data', 'weeklySchedule')),
        ]);
        const dataToInclude = {
            user: userProfile.exists() ? userProfile.data() : {},
            todos: todos.exists() ? (todos.data() as {items: TodoItem[]}).items : [],
            transactions: transactions.exists() ? (transactions.data() as {items: Transaction[]}).items : [],
            habits: habits.exists() ? (habits.data() as {items: Habit[]}).items : [],
            notes: notes.exists() ? (notes.data() as {items: Note[]}).items : [],
            schedule: schedule.exists() ? (schedule.data() as {items: any}).items : {},
        };
        userData = JSON.stringify(dataToInclude, null, 2);
      } catch (e) {
        console.error("Failed to gather user data:", e);
        toast({ variant: "destructive", title: "Could not load user data", description: "There was an error reading your app data from the database." });
      }
    }

    try {
      const aiResponse = await chat({ history, message: userMessage.content, userData });
      const aiMessage: Message = { id: `ai-${Date.now()}`, role: 'model', content: aiResponse.content };
      const finalMessages = [...newMessages, aiMessage];
      setMessages(finalMessages);
      saveChatHistory(finalMessages);
    } catch (error) {
      console.error(error);
      let errorMessageContent = "Failed to get response from AI. Please try again later.";
      let errorTitle = "An error occurred";

      if (error instanceof Error && error.message.includes('API key not valid')) {
        errorTitle = "AI Configuration Error";
        errorMessageContent = "The AI service API key is missing or invalid. Please ensure it's correctly set in your environment variables.";
      } else if (error instanceof Error) {
        errorMessageContent = error.message;
      }
      
      const errorMessage: Message = { id: `err-${Date.now()}`, role: 'model', content: `Sorry, something went wrong. \n\n**Error:** ${errorMessageContent}` };
      setMessages(prev => [...prev, errorMessage]);
      toast({ variant: "destructive", title: errorTitle, description: errorMessageContent });
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="absolute inset-x-0 top-14 bottom-16 flex flex-col bg-background">
        <ScrollArea className="flex-1" viewportRef={viewportRef}>
            <div className="max-w-4xl mx-auto p-4 space-y-6">
                {isHistoryLoading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-6 w-6 animate-spin" /></div>
                ) : (
                    messages.map((message) => {
                        if (message.role === 'model') {
                            return (
                              <div key={message.id} className="flex flex-col items-start gap-2">
                                <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-5 w-5"/></AvatarFallback></Avatar>
                                <div className="w-full max-w-4xl rounded-xl p-3 text-sm shadow-md whitespace-pre-wrap bg-card border"><MarkdownRenderer content={message.content} /></div>
                              </div>
                            );
                        }
                        return (
                            <div key={message.id} className="flex items-start gap-4 justify-end">
                                <div className="max-w-3xl rounded-xl p-3 text-sm shadow-md whitespace-pre-wrap bg-primary text-primary-foreground">{message.content}</div>
                                <Avatar className="h-9 w-9"><AvatarFallback><User className="h-5 w-5"/></AvatarFallback></Avatar>
                            </div>
                        );
                    })
                )}

                {isChatLoading && (
                    <div className="flex flex-col items-start gap-2">
                        <Avatar className="h-9 w-9"><AvatarFallback className="bg-primary/10 text-primary"><Bot className="h-5 w-5"/></AvatarFallback></Avatar>
                         <div className="bg-card border rounded-xl p-3 text-sm shadow-md">
                            <div className="flex items-center gap-2"><span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:0s]"></span><span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:0.15s]"></span><span className="h-2 w-2 bg-foreground/50 rounded-full animate-pulse [animation-delay:0.3s]"></span></div>
                        </div>
                    </div>
                )}
             </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-background">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
              <Input autoFocus value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask me anything..." disabled={isChatLoading || !user} className="flex-1" />
              <TooltipProvider delayDuration={0}>
                <AlertDialog>
                  <Tooltip>
                    <TooltipTrigger asChild><AlertDialogTrigger asChild><Button variant="outline" size="icon" type="button" disabled={isChatLoading}><PlusCircle className="h-4 w-4" /></Button></AlertDialogTrigger></TooltipTrigger>
                    <TooltipContent><p>New Chat</p></TooltipContent>
                  </Tooltip>
                  <AlertDialogContent className="sm:max-w-sm rounded-xl">
                    <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will start a new chat and permanently delete your current conversation history. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={handleNewChat}>Continue</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Tooltip>
                  <TooltipTrigger asChild><Button type="button" variant={includeData ? "default" : "outline"} size="icon" onClick={() => setIncludeData(p => !p)} disabled={isChatLoading} aria-label="Toggle including user data"><Database className="h-4 w-4" /></Button></TooltipTrigger>
                  <TooltipContent><p>{includeData ? 'Stop including app data' : 'Include app data in conversation'}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button type="submit" size="icon" disabled={!input.trim() || isChatLoading || !user}><Send className="h-4 w-4" /></Button>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
