
'use client';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2, Droplets, Wallet, CalendarCheck, ListChecks, Plus, Minus, GlassWater } from 'lucide-react';
import { P_ROUTINE_ITEMS, P_TODO_ITEMS, P_HABITS, P_TRANSACTIONS } from '@/lib/placeholder-data';
import type { RoutineItem, TodoItem, Habit, Transaction } from '@/types';
import { useState, useEffect, useRef } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format, isSameDay, parseISO, startOfMonth, parse } from 'date-fns';
import { calculateStreak } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

function WaterIntakeWidget() {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const loadHabits = () => {
      try {
        let habitsToSet: Habit[] = [];
        const storedHabits = localStorage.getItem('lifeos_habits');
        
        if (storedHabits) {
            habitsToSet = JSON.parse(storedHabits);
        } else {
            habitsToSet = P_HABITS;
        }
        
        // De-duplicate habits based on name to prevent rendering issues from stale data
        if (Array.isArray(habitsToSet)) {
            const uniqueHabitsMap = new Map<string, Habit>();
            for (const habit of habitsToSet) {
                if (habit && habit.name) {
                    uniqueHabitsMap.set(habit.name, habit);
                }
            }
            habitsToSet = Array.from(uniqueHabitsMap.values());
        } else {
            habitsToSet = P_HABITS;
        }
        
        const hasWaterHabit = habitsToSet.some(h => h.name === 'Water Drinking');

        if (!hasWaterHabit) {
            const waterHabitTemplate = P_HABITS.find(h => h.name === 'Water Drinking');
            if (waterHabitTemplate) {
                habitsToSet.push(waterHabitTemplate);
                localStorage.setItem('lifeos_habits', JSON.stringify(habitsToSet));
            }
        }
        
        setHabits(habitsToSet);
      } catch (e) {
        console.error("Failed to load habits, using placeholder data.", e);
        setHabits(P_HABITS);
      }
    };
    
    loadHabits();

    const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'lifeos_habits') {
            loadHabits();
        }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const waterHabit = habits.find(h => h.name === 'Water Drinking');
  const WATER_TARGET_ML = 2000;
  const ML_PER_GLASS = 250;
  const TARGET_GLASSES = WATER_TARGET_ML / ML_PER_GLASS;

  const handleIntakeChange = () => {
    if (!waterHabit) return;

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const updatedHabits = habits.map(h => {
      if (h.id === waterHabit.id) {
        const newCompletions = { ...h.completions };
        const currentCount = typeof newCompletions[todayKey] === 'number' ? (newCompletions[todayKey] as number) : 0;
        const newCount = currentCount + 1;
        newCompletions[todayKey] = newCount;
        return { ...h, completions: newCompletions };
      }
      return h;
    });

    setHabits(updatedHabits);
    localStorage.setItem('lifeos_habits', JSON.stringify(updatedHabits));
  };
  
  if (!waterHabit) return null;

  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const glassesToday = typeof waterHabit.completions[todayKey] === 'number' ? (waterHabit.completions[todayKey] as number) : 0;
  const mlToday = glassesToday * ML_PER_GLASS;
  
  return (
    <div className="w-full border rounded-xl shadow-sm flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
            <Button 
                onClick={handleIntakeChange} 
                variant="outline" 
                size="icon"
                className="h-12 w-12 flex-shrink-0 rounded-lg"
            >
                <GlassWater className="h-6 w-6 text-primary/70" />
            </Button>
            <div>
                <h3 className="font-headline text-sm font-semibold">Water Intake</h3>
                <p className="text-xl font-bold">{mlToday}ml <span className="text-base font-normal text-muted-foreground">/ {WATER_TARGET_ML}ml</span></p>
            </div>
        </div>
        <p className="text-sm text-muted-foreground">
            {glassesToday} of {TARGET_GLASSES} glasses
        </p>
    </div>
  );
}

function TodaysPlan() {
  const [routineItems] = useState<RoutineItem[]>(P_ROUTINE_ITEMS);
  const [displayedItems, setDisplayedItems] = useState<RoutineItem[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(1);

  useEffect(() => {
    const calculateDisplayedItems = () => {
      if (routineItems.length <= 3) {
        setDisplayedItems(routineItems);
        const now = new Date();
        const currentIndex = routineItems.findLastIndex(item => 
            parse(item.time, 'hh:mm a', new Date()) <= now
        );
        setHighlightedIndex(currentIndex);
        return;
      }

      const now = new Date();
      let currentIndex = routineItems.findIndex(item => {
        try {
          return parse(item.time, 'hh:mm a', new Date()) > now;
        } catch {
          return false;
        }
      });

      if (currentIndex === -1) {
        currentIndex = routineItems.length - 1;
      }

      let itemsToShow: RoutineItem[];
      
      if (currentIndex === 0) {
        itemsToShow = routineItems.slice(0, 3);
        setHighlightedIndex(0);
      } else if (currentIndex === routineItems.length - 1) {
        itemsToShow = routineItems.slice(routineItems.length - 3);
        setHighlightedIndex(2);
      } else {
        itemsToShow = routineItems.slice(currentIndex - 1, currentIndex + 2);
        setHighlightedIndex(1);
      }
      setDisplayedItems(itemsToShow);
    };

    calculateDisplayedItems();
    const timer = setInterval(calculateDisplayedItems, 60000); // Update every minute

    return () => clearInterval(timer);
  }, [routineItems]);

  return (
    <Card>
      <CardHeader className="py-4 sm:py-4">
        <CardTitle className="font-headline flex items-center gap-3 text-lg">
          <CalendarCheck className="h-6 w-6 text-primary" />
          <span>Today's Plan</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 sm:pt-0">
        {displayedItems.length > 0 ? (
          <ul className="space-y-3">
            {displayedItems.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  'p-3 rounded-lg transition-all duration-500 ease-in-out',
                  index === highlightedIndex
                    ? 'bg-primary/10 transform scale-105 shadow-lg'
                    : 'bg-muted opacity-60 scale-95'
                )}
              >
                <p>
                  <span className={cn('font-bold', index === highlightedIndex ? "text-primary" : "")}>{item.time}:</span>
                  <span className="font-semibold ml-2 text-card-foreground">{item.title}</span>
                </p>
                <p className="text-sm text-muted-foreground ml-2">{item.description}</p>
              </li>
            ))}
          </ul>
        ) : (
            <div className="text-center py-8 text-muted-foreground">
                <p>No routine items for today.</p>
            </div>
        )}
      </CardContent>
       <CardFooter className="pt-0 sm:pt-0">
         <Button variant="outline" className="w-full">View Full Planner</Button>
       </CardFooter>
    </Card>
  );
}


function FinancialSnapshot() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState(5000000); // in cents

  useEffect(() => {
    const loadData = () => {
      try {
        const storedTransactions = localStorage.getItem('lifeos_transactions');
        setTransactions(storedTransactions ? JSON.parse(storedTransactions) : P_TRANSACTIONS);
        const storedBudget = localStorage.getItem('lifeos_budget');
        setMonthlyBudget(storedBudget ? parseInt(storedBudget, 10) : 5000000);
      } catch (e) {
        console.error("Failed to load financial data, using placeholder data.", e);
        setTransactions(P_TRANSACTIONS);
      }
    };
    loadData();
    window.addEventListener('storage', loadData);
    return () => window.removeEventListener('storage', loadData);
  }, []);

  const today = new Date();
  const todaysExpenses = transactions
    .filter(t => t.type === 'expense' && isSameDay(parseISO(t.date), today))
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netBalance = totalIncome - totalExpenses;
  
  const startOfCurrentMonth = startOfMonth(today);
  const monthlyExpenses = transactions
    .filter(t => t.type === 'expense' && parseISO(t.date) >= startOfCurrentMonth)
    .reduce((sum, t) => sum + t.amount, 0);

  const budgetUsagePercent = monthlyBudget > 0 ? (monthlyExpenses / monthlyBudget) * 100 : 0;

  return (
    <Card>
      <CardHeader className="py-4 sm:py-4">
        <CardTitle className="font-headline flex items-center gap-3 text-lg">
          <Wallet className="h-6 w-6 text-primary" />
          <span>Financial Snapshot</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0 sm:pt-0">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Today's Expenses</span>
          <span className="font-semibold text-lg">{(todaysExpenses / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Net Balance</span>
          <span className="font-bold text-2xl">{(netBalance / 100).toFixed(2)}</span>
        </div>
        <div>
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Monthly Budget</span>
            <span>{(monthlyExpenses / 100).toFixed(2)} / {(monthlyBudget / 100).toFixed(2)}</span>
          </div>
          <Progress value={budgetUsagePercent} />
        </div>
      </CardContent>
    </Card>
  );
}

function TodoList() {
    const [todos, setTodos] = useState<TodoItem[]>(() => {
        if (typeof window === 'undefined') {
            return P_TODO_ITEMS;
        }
        try {
            const storedTodos = localStorage.getItem('lifeos_todos');
            return storedTodos ? JSON.parse(storedTodos) : P_TODO_ITEMS;
        } catch (e) {
            console.error("Failed to load todos, using placeholder data.", e);
            return P_TODO_ITEMS;
        }
    });

    const [isAddTodoDialogOpen, setIsAddTodoDialogOpen] = useState(false);
    const [newTodoText, setNewTodoText] = useState('');
    const [newTodoPriority, setNewTodoPriority] = useState<'high' | 'medium' | 'low'>('low');

    useEffect(() => {
        localStorage.setItem('lifeos_todos', JSON.stringify(todos));
    }, [todos]);

    const toggleTodo = (id: string) => {
        setTodos(prevTodos => prevTodos.map(todo => 
            todo.id === id ? { ...todo, completed: !todo.completed } : todo
        ));
    };

    const deleteTodo = (id: string) => {
        setTodos(prevTodos => prevTodos.filter(todo => todo.id !== id));
    };

    const addTodo = () => {
        if (newTodoText.trim() === '') return;
        const newTodo: TodoItem = {
            id: `todo-${Date.now()}`,
            text: newTodoText.trim(),
            completed: false,
            priority: newTodoPriority
        };
        setTodos(prevTodos => [newTodo, ...prevTodos]);
        setNewTodoText('');
        setNewTodoPriority('low');
        setIsAddTodoDialogOpen(false);
    };

    const getPriorityBadgeVariant = (priority?: 'high' | 'medium' | 'low') => {
        switch (priority) {
            case 'high': return 'destructive';
            case 'medium': return 'secondary';
            default: return 'outline';
        }
    }

  return (
     <Card>
      <CardHeader className="py-4 sm:py-4">
        <CardTitle className="font-headline flex items-center justify-between text-lg">
            <div className="flex items-center gap-3">
                <ListChecks className="h-6 w-6 text-primary" />
                <span>Today's To-Do List</span>
            </div>
             <Dialog open={isAddTodoDialogOpen} onOpenChange={setIsAddTodoDialogOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <PlusCircle className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add a new task</DialogTitle>
                        <DialogDescription>
                            What do you need to get done?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="new-todo-input">Task</Label>
                            <Input
                                id="new-todo-input"
                                value={newTodoText}
                                onChange={(e) => setNewTodoText(e.target.value)}
                                placeholder="e.g., Finish Q3 report"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        addTodo();
                                    }
                                }}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new-todo-priority">Priority</Label>
                            <Select value={newTodoPriority} onValueChange={(value) => setNewTodoPriority(value as 'high' | 'medium' | 'low')}>
                                <SelectTrigger id="new-todo-priority">
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={addTodo}>Add Task</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 sm:pt-0">
        <ul className="space-y-3">
            {todos.map(todo => (
                 <li key={todo.id} className="flex items-center space-x-3 group border-b pb-3">
                    <Checkbox id={`todo-${todo.id}`} checked={todo.completed} onCheckedChange={() => toggleTodo(todo.id)} />
                    <label htmlFor={`todo-${todo.id}`} className={cn("flex-1 text-sm", todo.completed && "line-through text-muted-foreground")}>{todo.text}</label>
                    {todo.priority && (
                        <Badge variant={getPriorityBadgeVariant(todo.priority)} className="capitalize">{todo.priority}</Badge>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive" onClick={() => deleteTodo(todo.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                 </li>
            ))}
        </ul>
        {todos.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
                <p>No tasks yet. Add one to get started!</p>
            </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
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
              <p className="text-muted-foreground">Here's your life at a glance.</p>
            </>
          ) : (
             <>
              <Skeleton className="h-8 w-3/5 mb-2" />
              <Skeleton className="h-5 w-4/5" />
            </>
          )}
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
                <WaterIntakeWidget />
            </div>
            <div className="lg:col-span-2">
                <TodaysPlan />
            </div>
            <div className="lg:col-span-1">
                <FinancialSnapshot />
            </div>
            <div className="lg:col-span-3">
                <TodoList />
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
