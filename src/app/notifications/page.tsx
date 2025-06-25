
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Notification } from '@/types';
import { P_NOTIFICATIONS } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BellRing, Check, Mail } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

const LOCAL_STORAGE_KEY_NOTIFICATIONS = 'lifeos_notifications';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    try {
      const storedNotifications = localStorage.getItem(LOCAL_STORAGE_KEY_NOTIFICATIONS);
      setNotifications(storedNotifications ? JSON.parse(storedNotifications) : P_NOTIFICATIONS);
    } catch (e) {
      console.error("Failed to load notifications", e);
      setNotifications(P_NOTIFICATIONS);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const toggleReadStatus = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({...n, read: true})));
  }

  const sortedNotifications = [...notifications].sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());

  return (
    <AppLayout>
      <div className="space-y-4">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-headline">Notifications</h1>
            <p className="text-muted-foreground">Your reminders and alerts.</p>
          </div>
          <Button onClick={markAllAsRead} variant="outline" size="sm">
            <Check className="mr-2 h-4 w-4" />
            Mark all as read
          </Button>
        </header>

        <div className="space-y-4">
          {sortedNotifications.length > 0 ? (
            sortedNotifications.map(notification => (
              <Card key={notification.id} className={cn('transition-colors', !notification.read && 'bg-primary/5 border-primary/20')}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn("mt-1", !notification.read ? 'text-primary' : 'text-muted-foreground')}>
                        <BellRing className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{notification.title}</CardTitle>
                      <CardDescription>{format(parseISO(notification.date), 'PPP')}</CardDescription>
                    </div>
                  </div>
                   <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => toggleReadStatus(notification.id)}>
                        {notification.read ? <Mail className="h-4 w-4 text-muted-foreground"/> : <Check className="h-4 w-4 text-primary"/>}
                        <span className="sr-only">Mark as {notification.read ? 'unread' : 'read'}</span>
                    </Button>
                </CardHeader>
                <CardContent className="p-4 pt-0 pl-14">
                  <p className="text-sm text-foreground/80">{notification.message}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-16 text-muted-foreground border rounded-lg bg-muted/40">
              <p>You have no notifications.</p>
              <p className="text-sm">Set reminders from the calendar in the header.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
