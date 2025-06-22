
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
  User,
  Moon,
  Sun,
  KeyRound,
  Settings as SettingsIcon,
  UserCog,
  Power,
  PlusCircle,
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
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

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

function UserNav({ user, onLogout, onUsernameChange }: { user: { username: string } | null, onLogout: () => void, onUsernameChange: (newUsername: string) => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [tempUsername, setTempUsername] = useState(user?.username || '');

  useEffect(() => {
    if (user?.username) {
      setTempUsername(user.username);
    }
  }, [user?.username]);

  const handleUsernameSave = () => {
    if (tempUsername.trim()) {
      onUsernameChange(tempUsername.trim());
      setIsEditingUsername(false);
      toast({ title: 'Username updated successfully!' });
    } else {
      toast({ title: 'Username cannot be empty.', variant: 'destructive' });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleUsernameSave();
    if (e.key === 'Escape') setIsEditingUsername(false);
  };
  
  if (!user) return <Skeleton className="h-8 w-8 rounded-full" />;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${user.username}`} alt={user.username} />
            <AvatarFallback>{user.username.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-2">
            {isEditingUsername ? (
              <div className="flex items-center gap-2">
                <Input value={tempUsername} onChange={(e) => setTempUsername(e.target.value)} onKeyDown={handleKeyDown} className="h-8" autoFocus />
                <Button size="sm" onClick={handleUsernameSave}>Save</Button>
              </div>
            ) : (
              <p className="text-sm font-medium leading-none">{user.username}</p>
            )}
            <p className="text-xs leading-none text-muted-foreground">
              Welcome back!
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
           <DropdownMenuItem onSelect={() => setIsEditingUsername(true)}>
             <User className="mr-2 h-4 w-4" />
             <span>Edit Username</span>
           </DropdownMenuItem>
           <DropdownMenuItem onSelect={() => router.push('/profile')}>
            <UserCog className="mr-2 h-4 w-4" />
            <span>Edit Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Add Account</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/password-manager')}>
            <KeyRound className="mr-2 h-4 w-4" />
            <span>Password Manager</span>
          </DropdownMenuItem>
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
  
  const handleUsernameChange = (newUsername: string) => {
    const updatedUser = { username: newUsername };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
        <UserNav user={user} onLogout={handleLogout} onUsernameChange={handleUsernameChange} />
      </header>
      <main className="flex-1 p-4 md:p-6 pb-24">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
