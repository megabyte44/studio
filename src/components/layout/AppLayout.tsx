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
  PanelLeft,
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
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/expenses', icon: Wallet, label: 'Expenses' },
  { href: '/habits', icon: CheckCircle2, label: 'Habits' },
  { href: '/notes', icon: StickyNote, label: 'Notes' },
];

function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden border-t bg-background/95 backdrop-blur-sm">
      <div className="flex justify-around h-16 items-center">
        {navItems.map((item) => (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              'flex flex-col items-center justify-center w-full gap-1 text-sm',
              pathname === item.href
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <item.icon className="h-6 w-6" />
            <span>{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

function MainSidebar() {
  const pathname = usePathname();
  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-3">
          <h1 className="font-headline text-lg font-bold text-primary">LifeOS</h1>
          <div className="flex-1" />
          <SidebarTrigger className="hidden md:flex"/>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton asChild isActive={pathname === item.href} tooltip={item.label}>
                <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}

function UserNav({ user, onLogout }: { user: { username: string } | null, onLogout: () => void }) {
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
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.username}</p>
            <p className="text-xs leading-none text-muted-foreground">
              Welcome back!
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
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
  const isMobile = useIsMobile();

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
    <SidebarProvider>
        <div className="flex min-h-screen">
          <MainSidebar />
          <SidebarInset>
             <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm md:static md:h-auto md:border-0 md:bg-transparent md:px-6 md:pt-4">
                <SidebarTrigger className="md:hidden"/>
                <div className="flex-1" />
                <UserNav user={user} onLogout={handleLogout} />
            </header>
            <main className={cn("p-4 md:p-6", isMobile && "pb-20")}>
              {children}
            </main>
          </SidebarInset>
        </div>
        {isMobile && <BottomNav />}
    </SidebarProvider>
  );
}
