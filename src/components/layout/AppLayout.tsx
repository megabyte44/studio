
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Wallet,
  CheckCircle2,
  StickyNote,
  LogOut,
  Moon,
  Sun,
  KeyRound,
  Settings as SettingsIcon,
  UserCog,
  Power,
  PlusCircle,
  CalendarDays,
  Bell,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Notification } from '@/types';
import { P_NOTIFICATIONS } from '@/lib/placeholder-data';


const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/habits', icon: CheckCircle2, label: 'Habits' },
  { href: '/notes', icon: StickyNote, label: 'Notes' },
];

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur-sm">
      <div className="flex justify-center h-16 items-center gap-x-8 sm:gap-x-16">
        {navItems.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              'flex flex-col items-center justify-center gap-1 text-sm transition-colors',
              pathname === item.href
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
      const storedTheme = typeof window !== 'undefined' ? localStorage.getItem('theme') || 'light' : 'light';
      setTheme(storedTheme);
      document.documentElement.classList.toggle('dark', storedTheme === 'dark');
  }, []);

  const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      localStorage.setItem('theme', newTheme);
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  return (
      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                  {theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                  <span>Dark Mode</span>
              </div>
              <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} aria-label="Toggle dark mode" />
          </div>
      </DropdownMenuItem>
  );
}

function SyncToggle() {
  return (
      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
         <div className="flex items-center justify-between w-full">
              <div className="flex items-center">
                  <Power className="mr-2 h-4 w-4" />
                  <span>Sync</span>
              </div>
              <Switch aria-label="Toggle sync" />
         </div>
      </DropdownMenuItem>
  );
}

function UserNav({ user, onLogout }: { user: { username: string } | null, onLogout: () => void }) {
  const router = useRouter();
  
  if (!user) return <Skeleton className="h-8 w-8 rounded-full" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="profile silhouette" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              Welcome back!
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuItem onSelect={() => router.push('/profile')}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
           <DropdownMenuItem onSelect={() => router.push('/planner')}>
            <CalendarDays className="mr-2 h-4 w-4" />
            <span>Daily Planner</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/password-manager')}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>Password Manager</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Add Account</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/settings')}>
            <SettingsIcon className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <ThemeToggle />
        <SyncToggle />
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const loadNotifications = () => {
        try {
            const stored = localStorage.getItem('lifeos_notifications');
            setNotifications(stored ? JSON.parse(stored) : P_NOTIFICATIONS);
        } catch {
            setNotifications(P_NOTIFICATIONS);
        }
    }
    loadNotifications();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'lifeos_notifications') {
            loadNotifications();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">Open notifications</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <ScrollArea className="max-h-80">
            <div className="p-2 space-y-2">
                {unreadCount > 0 ? (
                    <>
                        <h4 className="font-medium text-sm px-2">Unread</h4>
                        {notifications.filter(n => !n.read).slice(0, 5).map(n => (
                            <div key={n.id} className="text-sm p-2 rounded-md hover:bg-accent">
                                <p className="font-semibold">{n.title}</p>
                                <p className="text-muted-foreground truncate">{n.message}</p>
                            </div>
                        ))}
                    </>
                ) : (
                    <p className="text-sm text-center text-muted-foreground py-8">No unread notifications.</p>
                )}
            </div>
        </ScrollArea>
        <div className="p-1 border-t bg-muted/50">
            <Button variant="ghost" className="w-full h-8 text-xs" onClick={() => {
                setIsOpen(false);
                router.push('/notifications');
            }}>
                View all notifications
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function HeaderCalendar() {
  const [date, setDate] = useState<Date>();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAddReminder = () => {
    if (!date || !title.trim() || !message.trim()) {
        return;
    }

    const newReminder: Notification = {
        id: `notif-${Date.now()}`,
        title,
        message,
        date: format(date, 'yyyy-MM-dd'),
        read: false,
    };
    
    try {
        const stored = localStorage.getItem('lifeos_notifications');
        const notifications = stored ? JSON.parse(stored) : [];
        const updatedNotifications = [newReminder, ...notifications];
        localStorage.setItem('lifeos_notifications', JSON.stringify(updatedNotifications));

        window.dispatchEvent(new StorageEvent('storage', {
            key: 'lifeos_notifications',
            newValue: JSON.stringify(updatedNotifications),
        }));

        // Reset form
        setDate(undefined);
        setTitle('');
        setMessage('');
        setIsPopoverOpen(false);

    } catch (error) {
      console.error(error);
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <CalendarDays className="h-4 w-4" />
          <span className="sr-only">Open calendar</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          disabled={(d) => d < today}
          initialFocus
        />
        {date && (
            <div className="p-2 border-t space-y-2">
                <h4 className="font-semibold text-xs text-center">Add Reminder for {format(date, 'MMM d')}</h4>
                <div className="space-y-1">
                    <Label htmlFor="reminder-title" className="text-xs px-1">Title</Label>
                    <Input id="reminder-title" placeholder="e.g., Mom's Birthday" value={title} onChange={(e) => setTitle(e.target.value)} className="h-8 text-xs" />
                </div>
                 <div className="space-y-1">
                    <Label htmlFor="reminder-message" className="text-xs px-1">Message</Label>
                    <Textarea id="reminder-message" placeholder="e.g., Call her in the morning" value={message} onChange={(e) => setMessage(e.target.value)} className="text-xs min-h-[60px]"/>
                </div>
                <Button size="sm" className="w-full h-8 text-xs" onClick={handleAddReminder}>
                    Set Reminder
                </Button>
            </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsVerified(true);
      } else {
        router.replace('/');
      }
    } catch (error) {
      router.replace('/');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/');
  };
  
  if (!isVerified) {
    return (
      <div className="flex h-screen w-screen items-center justify-center p-4">
        <div className="flex flex-col space-y-3 w-full">
            <Skeleton className="h-[125px] w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-4 border-b bg-background/95 px-4 sm:px-6 backdrop-blur-sm">
        <h1 className="font-headline text-lg font-bold text-primary">LifeOS</h1>
        <div className="flex-1" />
        <NotificationBell />
        <HeaderCalendar />
        <UserNav user={user} onLogout={handleLogout} />
      </header>
      <main className="flex-1 p-4 md:p-6 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
