'use client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { P_ROUTINE_ITEMS, P_TODO_ITEMS } from '@/lib/placeholder-data';
import type { RoutineItem, TodoItem } from '@/types';
import { useState, useEffect } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

function DayRoutine() {
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>(P_ROUTINE_ITEMS);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-headline flex items-center justify-between">
          <span>Day Routine</span>
          <Button variant="ghost" size="icon">
            <PlusCircle className="h-5 w-5" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {routineItems.map((item) => (
            <li key={item.id} className="flex items-start space-x-4 group">
              <div className="flex-shrink-0 w-20 text-right">
                <p className="font-bold text-primary">{item.time}</p>
              </div>
              <div className="relative w-full">
                <div className="absolute top-2 -left-[22.5px] h-full border-l-2 border-border"></div>
                <div className="absolute top-2 -left-[26px] h-3 w-3 rounded-full bg-primary border-2 border-background"></div>
                <p className="font-semibold text-card-foreground">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
                 <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0 flex items-center">
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowUp className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><ArrowDown className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function TodoList() {
    const [todos, setTodos] = useState<TodoItem[]>(P_TODO_ITEMS);

    const toggleTodo = (id: string) => {
        setTodos(todos.map(todo => todo.id === id ? {...todo, completed: !todo.completed} : todo));
    }

  return (
     <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center justify-between">
            <span>To-Do List</span>
            <Button variant="ghost" size="icon">
                <PlusCircle className="h-5 w-5" />
            </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
            {todos.map(todo => (
                 <li key={todo.id} className="flex items-center space-x-3 group">
                    <Checkbox id={`todo-${todo.id}`} checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id)} />
                    <label htmlFor={`todo-${todo.id}`} className={cn("flex-1 text-sm", todo.completed && "line-through text-muted-foreground")}>{todo.text}</label>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                 </li>
            ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function Alarm() {
    const [time, setTime] = useState<string | null>(null);

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Next Alarm</CardTitle>
                <CardDescription>08:00 AM - Morning Briefing</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center">
                <div className="text-6xl font-bold font-headline text-primary tabular-nums">
                    {time || <span className="opacity-50">00:00</span>}
                </div>
                <p className="text-muted-foreground">The current time</p>
            </CardContent>
        </Card>
    )
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    // This will only run on the client, after hydration
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return 'Good Morning';
      if (hour < 18) return 'Good Afternoon';
      return 'Good Evening';
    };
    setGreeting(getGreeting());
  }, []);

  return (
    <AppLayout>
      <div className="space-y-4">
        <header>
          {user ? (
            <>
              <h1 className="text-2xl font-bold font-headline">
                {greeting}, {user.username}!
              </h1>
              <p className="text-muted-foreground">Welcome back! Here's your life at a glance.</p>
            </>
          ) : (
             <>
              <Skeleton className="h-8 w-3/5 mb-1" />
              <Skeleton className="h-5 w-4/5" />
            </>
          )}
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <DayRoutine />
            </div>
            <div className="space-y-6">
                <TodoList />
                <Alarm />
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
