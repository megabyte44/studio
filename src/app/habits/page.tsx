'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Habit, Exercise, WorkoutDay, CyclicalWorkoutSplit, CycleConfig, ProteinIntake, LoggedFoodItem, CompletedWorkouts } from '@/types';
import { P_HABITS } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Flame, List, Dumbbell, CalendarDays, Edit, Beef, Apple, Settings, Trash2, Check, AlertTriangle, ChevronLeft, ChevronRight, Droplets, Plus, Minus } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { subDays, format, isSameDay, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, differenceInCalendarDays } from 'date-fns';
import { calculateStreak, cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';

// --- Initial Data for Gym Tracker ---
const initialWorkoutSplit: CyclicalWorkoutSplit = {
  "Day 1": { title: "Push Day (Chest, Shoulders, Triceps)", exercises: [{ name: "Bench Press", sets: "3-4", reps: "8-12" }, { name: "Overhead Press", sets: "3", reps: "8-12" }, { name: "Incline Dumbbell Press", sets: "3", reps: "10-15" }, { name: "Tricep Dips/Pushdowns", sets: "3", reps: "10-15" }, { name: "Lateral Raises", sets: "3", reps: "12-15" }] },
  "Day 2": { title: "Pull Day (Back, Biceps)", exercises: [{ name: "Pull-ups/Lat Pulldowns", sets: "3-4", reps: "6-12" }, { name: "Bent-over Rows", sets: "3", reps: "8-12" }, { name: "Seated Cable Rows", sets: "3", reps: "10-15" }, { name: "Barbell Curls", sets: "3", reps: "8-12" }, { name: "Face Pulls", sets: "3", reps: "15-20" }] },
  "Day 3": { title: "Leg Day (Quads, Hamstrings, Calves)", exercises: [{ name: "Squats", sets: "3-4", reps: "8-12" }, { name: "Romanian Deadlifts", sets: "3", reps: "10-12" }, { name: "Leg Press", sets: "3", reps: "10-15" }, { name: "Leg Curls", sets: "3", reps: "10-15" }, { name: "Calf Raises", sets: "3", reps: "15-20" }] },
  "Day 4 (Rest)": { title: "Rest or Active Recovery", exercises: [] },
};
const initialCustomFoodItems = ["Protein Powder", "Creatine", "Oatmeal", "Eggs", "Chicken Breast", "Greek Yogurt"];


function GymTracker() {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    
    // State
    const [proteinIntakes, setProteinIntakes] = useState<ProteinIntake[]>([]);
    const [loggedFoodItems, setLoggedFoodItems] = useState<LoggedFoodItem[]>([]);
    const [proteinTarget, setProteinTarget] = useState(150);
    const [customFoodItems, setCustomFoodItems] = useState<string[]>(initialCustomFoodItems);
    const [cyclicalWorkoutSplit, setCyclicalWorkoutSplit] = useState<CyclicalWorkoutSplit>(initialWorkoutSplit);
    const [cycleConfig, setCycleConfig] = useState<CycleConfig>({ startDate: format(new Date(), 'yyyy-MM-dd'), startDayKey: "Day 1" });
    const [completedWorkouts, setCompletedWorkouts] = useState<CompletedWorkouts>({});
    const [currentDisplayMonth, setCurrentDisplayMonth] = useState(new Date());

    // Dialog states
    const [isCycleConfigOpen, setIsCycleConfigOpen] = useState(false);
    const [isWorkoutPlanOpen, setIsWorkoutPlanOpen] = useState(false);
    const [isFoodManagerOpen, setIsFoodManagerOpen] = useState(false);

    // --- Logic and Handlers ---
    const getWorkoutDayInfoForDate = useCallback((date: Date) => {
        const cycleWorkoutKeys = Object.keys(cyclicalWorkoutSplit);
        const cycleLength = cycleWorkoutKeys.length;
        if (!cycleConfig.startDate || !cycleConfig.startDayKey || cycleLength === 0) {
            return { key: "N/A", title: "Cycle Not Configured", exercises: [], isRestDay: false };
        }
        
        const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const normalizedStartDate = new Date(parseISO(cycleConfig.startDate));
        
        const daysSinceStart = differenceInCalendarDays(normalizedDate, normalizedStartDate);

        if (daysSinceStart < 0) {
            return { key: "N/A", title: "Cycle Starts in Future", exercises: [], isRestDay: true };
        }

        let startIndexInCycle = cycleWorkoutKeys.indexOf(cycleConfig.startDayKey);
        if (startIndexInCycle === -1) {
            return { key: "Error", title: "Invalid Start Day Key", exercises: [], isRestDay: true };
        }
        const currentDayIndexInCycle = (startIndexInCycle + daysSinceStart) % cycleLength;
        const workoutKey = cycleWorkoutKeys[currentDayIndexInCycle];
        const workoutData = cyclicalWorkoutSplit[workoutKey] || { title: "Undefined Workout", exercises: [] };
        const isRestDay = workoutData.exercises.length === 0 || workoutData.title.toLowerCase().includes("rest");

        return { key: workoutKey, ...workoutData, isRestDay };
    }, [cyclicalWorkoutSplit, cycleConfig]);

    const todaysWorkoutInfo = useMemo(() => getWorkoutDayInfoForDate(new Date()), [getWorkoutDayInfoForDate]);
    const isTodayCompleted = !!completedWorkouts[format(new Date(), 'yyyy-MM-dd')];

    // Effect for loading from localStorage
    useEffect(() => {
        try {
            const storedWorkouts = localStorage.getItem('gym_completed_workouts');
            if(storedWorkouts) setCompletedWorkouts(JSON.parse(storedWorkouts));

            const storedCycleConfig = localStorage.getItem('gym_cycle_config');
            if(storedCycleConfig) setCycleConfig(JSON.parse(storedCycleConfig));
            
            const storedSplit = localStorage.getItem('gym_workout_split');
            if(storedSplit) setCyclicalWorkoutSplit(JSON.parse(storedSplit));

            const storedProteinTarget = localStorage.getItem('gym_protein_target');
            if(storedProteinTarget) setProteinTarget(JSON.parse(storedProteinTarget));

            const storedCustomFoods = localStorage.getItem('gym_custom_foods');
            if(storedCustomFoods) setCustomFoodItems(JSON.parse(storedCustomFoods));
        } catch (e) {
            console.error("Failed to load gym data from local storage", e);
        }

        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    // Effect for saving to localStorage
    useEffect(() => {
        if (isLoading) return;
        localStorage.setItem('gym_completed_workouts', JSON.stringify(completedWorkouts));
        localStorage.setItem('gym_cycle_config', JSON.stringify(cycleConfig));
        localStorage.setItem('gym_workout_split', JSON.stringify(cyclicalWorkoutSplit));
        localStorage.setItem('gym_protein_target', JSON.stringify(proteinTarget));
        localStorage.setItem('gym_custom_foods', JSON.stringify(customFoodItems));
    }, [completedWorkouts, cycleConfig, cyclicalWorkoutSplit, proteinTarget, customFoodItems, isLoading]);
    
    // --- Event Handlers ---
    const handleToggleWorkoutCompletion = () => {
        const todayKey = format(new Date(), 'yyyy-MM-dd');
        const newCompletedWorkouts = {...completedWorkouts, [todayKey]: !isTodayCompleted };
        setCompletedWorkouts(newCompletedWorkouts);
        toast({ title: !isTodayCompleted ? 'Workout Completed!' : 'Workout marked as not done.' });
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <header className="space-y-1">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-primary" />
                    <span>Gym Tracker</span>
                </h2>
                <p className="text-muted-foreground">Plan your workouts, monitor your nutrition, and track your progress.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 {/* Workout Plan Card */}
                <Card className={cn("lg:col-span-3", isTodayCompleted && "bg-muted/50")}>
                    <CardHeader className="flex flex-row items-start justify-between">
                        <div>
                            <CardTitle className="font-headline flex items-center gap-3">
                                <List className="h-6 w-6 text-primary" />
                                <span>{todaysWorkoutInfo.key}: {todaysWorkoutInfo.title}</span>
                            </CardTitle>
                            <CardDescription>
                                Today ({format(new Date(), 'eeee, MMM d')})
                            </CardDescription>
                        </div>
                         <div className="flex gap-2">
                            <Dialog open={isCycleConfigOpen} onOpenChange={setIsCycleConfigOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon"><CalendarDays className="h-5 w-5" /></Button>
                                </DialogTrigger>
                                {/* Cycle Config Dialog Content */}
                            </Dialog>
                             <Dialog open={isWorkoutPlanOpen} onOpenChange={setIsWorkoutPlanOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="icon"><Edit className="h-5 w-5" /></Button>
                                </DialogTrigger>
                                {/* Manage Workout Plan Dialog */}
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {todaysWorkoutInfo.exercises.length > 0 ? (
                            <ul className="space-y-3">
                                {todaysWorkoutInfo.exercises.map((ex, i) => (
                                    <li key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                                        <span className="font-semibold">{ex.name}</span>
                                        <span className="text-sm text-muted-foreground">Sets: {ex.sets}, Reps: {ex.reps}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                             <p className="text-center text-muted-foreground py-8">{todaysWorkoutInfo.title}</p>
                        )}
                    </CardContent>
                    {!todaysWorkoutInfo.isRestDay && (
                        <CardFooter>
                            <Button className="w-full" onClick={handleToggleWorkoutCompletion} variant={isTodayCompleted ? 'secondary' : 'default'}>
                                <Check className="mr-2 h-4 w-4"/>
                                {isTodayCompleted ? 'Workout Completed!' : "Mark Today's Workout as Done"}
                            </Button>
                        </CardFooter>
                    )}
                </Card>
                 
                {/* Workout Calendar Card */}
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="font-headline">Workout Log Calendar</CardTitle>
                        <CardDescription>Green means completed, Red means missed.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <WorkoutCalendar 
                            currentMonth={currentDisplayMonth}
                            setCurrentMonth={setCurrentDisplayMonth}
                            completedWorkouts={completedWorkouts}
                            getWorkoutDayInfoForDate={getWorkoutDayInfoForDate}
                        />
                    </CardContent>
                </Card>

                {/* Nutrition Section */}
                <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
                    {/* Protein Intake Card */}
                    <ProteinTrackerCard 
                      intakes={proteinIntakes}
                      setIntakes={setProteinIntakes}
                      target={proteinTarget}
                      setTarget={setProteinTarget}
                    />

                    {/* Food & Supplement Log Card */}
                    <FoodLogCard 
                      loggedItems={loggedFoodItems}
                      setLoggedItems={setLoggedFoodItems}
                      customItems={customFoodItems}
                      onManageItems={() => setIsFoodManagerOpen(true)}
                    />
                </div>
            </div>
            {/* Dialogs need to be implemented */}
        </div>
    )
}

function WorkoutCalendar({ currentMonth, setCurrentMonth, completedWorkouts, getWorkoutDayInfoForDate }: any) {
    const today = new Date();
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startingDayOfWeek = getDay(monthStart);

    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
        <div className="w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h3 className="text-lg font-semibold font-headline">{format(currentMonth, 'MMMM yyyy')}</h3>
                <Button variant="outline" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-7 gap-2 text-center">
                {dayHeaders.map(day => <div key={day} className="font-bold text-muted-foreground text-sm">{day}</div>)}
                {Array.from({ length: startingDayOfWeek }).map((_, i) => <div key={`empty-${i}`} />)}
                {days.map(day => {
                    const dateKey = format(day, 'yyyy-MM-dd');
                    const workoutInfo = getWorkoutDayInfoForDate(day);
                    const isCompleted = completedWorkouts[dateKey];
                    const isMissed = !isCompleted && day < today && !workoutInfo.isRestDay;

                    return (
                        <div key={dateKey} className={cn(
                            "h-10 w-10 flex items-center justify-center rounded-full text-sm",
                            isSameDay(day, today) && "bg-primary text-primary-foreground",
                            isCompleted && "bg-green-200 text-green-800",
                            isMissed && "bg-red-200 text-red-800"
                        )}>
                            {format(day, 'd')}
                        </div>
                    );
                })}
            </div>
        </div>
    )
}

function ProteinTrackerCard({ intakes, setIntakes, target, setTarget }: any) {
    const { toast } = useToast();
    const [amount, setAmount] = useState('');

    const totalProtein = useMemo(() => intakes.reduce((sum: number, intake: ProteinIntake) => sum + intake.amount, 0), [intakes]);
    const progress = useMemo(() => (target > 0 ? Math.min(100, (totalProtein / target) * 100) : 0), [totalProtein, target]);

    const handleLogProtein = () => {
        const numAmount = parseInt(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            toast({ title: "Invalid Amount", description: "Please enter a positive number.", variant: "destructive" });
            return;
        }
        const newIntake: ProteinIntake = { id: `p-${Date.now()}`, amount: numAmount, timestamp: new Date().toISOString() };
        setIntakes([...intakes, newIntake]);
        setAmount('');
        toast({ title: "Protein Logged", description: `${numAmount}g of protein added.` });
    };

    const handleDelete = (id: string) => {
        setIntakes(intakes.filter((i: ProteinIntake) => i.id !== id));
        toast({ title: "Entry Removed" });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-3"><Beef className="h-6 w-6 text-primary" /> <span>Protein Intake</span></CardTitle>
                <CardDescription>Target: {totalProtein}g / {target}g</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="proteinTarget" className="text-sm">Daily Protein Target (g)</Label>
                    <Input id="proteinTarget" type="number" value={target} onChange={e => setTarget(Number(e.target.value))} placeholder="e.g., 150" />
                </div>
                <Progress value={progress} />
                 <div className="flex gap-2">
                    <Input type="number" placeholder="Protein (g)" value={amount} onChange={e => setAmount(e.target.value)} />
                    <Button onClick={handleLogProtein}><PlusCircle className="h-4 w-4" /></Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                    {intakes.length > 0 ? intakes.map((intake: ProteinIntake) => (
                        <div key={intake.id} className="flex justify-between items-center text-sm bg-muted p-2 rounded-md">
                           <span>{intake.amount}g at {format(parseISO(intake.timestamp), 'h:mm a')}</span>
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(intake.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    )).reverse() : <p className="text-sm text-muted-foreground text-center pt-4">No protein logged yet.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function FoodLogCard({ loggedItems, setLoggedItems, customItems, onManageItems }: any) {
    const { toast } = useToast();
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    const handleLogItem = (name: string) => {
        const newItem: LoggedFoodItem = { id: `f-${Date.now()}`, name, timestamp: new Date().toISOString() };
        setLoggedItems([...loggedItems, newItem]);
        toast({ title: `${name} logged.` });
    };
    
    const handleDelete = (id: string) => {
        setLoggedItems(loggedItems.filter((i: LoggedFoodItem) => i.id !== id));
        toast({ title: "Food Entry Removed" });
    };

    const todaysLoggedItems = loggedItems.filter((i: LoggedFoodItem) => format(parseISO(i.timestamp), 'yyyy-MM-dd') === todayKey);

    return (
        <Card>
            <CardHeader className="flex flex-row justify-between items-start">
                <div>
                    <CardTitle className="font-headline flex items-center gap-3"><Apple className="h-6 w-6 text-primary" /> <span>Food & Supplement Log</span></CardTitle>
                    <CardDescription>Quick log common items for today.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={onManageItems}><Settings className="h-5 w-5" /></Button>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                    {customItems.map((item: string) => {
                        const isLogged = todaysLoggedItems.some((li: LoggedFoodItem) => li.name === item);
                        return (
                            <Button key={item} variant="outline" onClick={() => handleLogItem(item)} disabled={isLogged} className="justify-between">
                                {item} {isLogged && <Check className="h-4 w-4" />}
                            </Button>
                        );
                    })}
                </div>
                <Separator/>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                     {todaysLoggedItems.length > 0 ? todaysLoggedItems.map((item: LoggedFoodItem) => (
                        <div key={item.id} className="flex justify-between items-center text-sm bg-muted p-2 rounded-md">
                           <span>{item.name} at {format(parseISO(item.timestamp), 'h:mm a')}</span>
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    )).reverse() : <p className="text-sm text-muted-foreground text-center pt-4">No items logged yet today.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function WaterIntakeManager({ habit, onUpdate }: { habit: Habit; onUpdate: (habit: Habit) => void }) {
  if (!habit || habit.name !== 'Drink 2L Water') return null;

  const WATER_TARGET_ML = 2000;
  const ML_PER_GLASS = 250;
  const TARGET_GLASSES = WATER_TARGET_ML / ML_PER_GLASS;

  const handleIntakeChange = (increment: number) => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    const newCompletions = { ...habit.completions };
    const currentCount = typeof newCompletions[todayKey] === 'number' ? (newCompletions[todayKey] as number) : 0;
    const newCount = Math.max(0, currentCount + increment);

    if (newCount > 0) {
      newCompletions[todayKey] = newCount;
    } else {
      delete newCompletions[todayKey];
    }
    
    onUpdate({ ...habit, completions: newCompletions });
  };
  
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const glassesToday = typeof habit.completions[todayKey] === 'number' ? (habit.completions[todayKey] as number) : 0;
  const mlToday = glassesToday * ML_PER_GLASS;
  const streak = calculateStreak(habit.completions, TARGET_GLASSES);
  
  return (
    <Card className="xl:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline flex items-center justify-between">
            <div className='flex items-center gap-3'>
                <Droplets className="h-6 w-6 text-primary" />
                <span>Water Intake Tracker</span>
            </div>
            <div className="flex items-center gap-1 text-primary">
                <Flame className="h-5 w-5" />
                <span className="font-bold text-lg">{streak} Day Streak</span>
            </div>
        </CardTitle>
        <CardDescription>
            Log your daily water intake. Each glass is 250ml. Your goal is 2L ({TARGET_GLASSES} glasses).
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-center justify-center gap-4">
          <Button onClick={() => handleIntakeChange(-1)} variant="outline" size="icon" disabled={glassesToday === 0}>
              <Minus className="h-4 w-4" />
          </Button>
          <div className="text-center">
              <p className="text-4xl font-bold font-headline">{mlToday}ml</p>
              <p className="text-sm text-muted-foreground">{glassesToday} / {TARGET_GLASSES} glasses</p>
          </div>
          <Button onClick={() => handleIntakeChange(1)} variant="outline" size="icon">
              <Plus className="h-4 w-4" />
          </Button>
      </CardContent>
    </Card>
  )
}

function HabitGrid({ habit, onToggle }: { habit: Habit; onToggle: (habitId: string, date: string) => void }) {
  const today = new Date();
  const days = Array.from({ length: 30 }).map((_, i) => subDays(today, i)).reverse();
  const Icon = (LucideIcons as any)[habit.icon] || LucideIcons.CheckCircle2;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3">
          <Icon className="h-6 w-6 text-primary" />
          <CardTitle className="font-headline text-lg">{habit.name}</CardTitle>
        </div>
        <div className="flex items-center gap-1 text-orange-500">
            <Flame className="h-5 w-5" />
            <span className="font-bold text-lg">{calculateStreak(habit.completions)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <TooltipProvider>
            <div className="flex justify-end gap-1.5 flex-wrap">
                {days.map((day) => {
                    const dateString = format(day, 'yyyy-MM-dd');
                    const isCompleted = !!habit.completions[dateString];
                    return (
                        <Tooltip key={dateString} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => onToggle(habit.id, dateString)}
                                    className={cn(
                                        'h-7 w-7 rounded-sm transition-colors',
                                        isCompleted ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-accent',
                                        isSameDay(day, today) && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
                                    )}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{format(day, 'MMM d, yyyy')}</p>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    try {
      const storedHabits = localStorage.getItem('lifeos_habits');
      if (storedHabits) {
        setHabits(JSON.parse(storedHabits));
      } else {
        setHabits(P_HABITS);
      }
    } catch (error) {
      console.error("Failed to load habits from localStorage", error);
      setHabits(P_HABITS);
    }
  }, []);

  useEffect(() => {
    if (habits.length > 0) {
      localStorage.setItem('lifeos_habits', JSON.stringify(habits));
    }
  }, [habits]);

  const handleUpdateHabit = (updatedHabit: Habit) => {
    setHabits(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const handleToggleCompletion = (habitId: string, date: string) => {
    setHabits(habits.map(h => {
        if (h.id === habitId && h.name !== 'Drink 2L Water') {
            const newCompletions = {...h.completions};
            if(newCompletions[date]) {
                delete newCompletions[date];
            } else {
                newCompletions[date] = true;
            }
            return {...h, completions: newCompletions};
        }
        return h;
    }));
  }

  const waterHabit = habits.find(h => h.name === 'Drink 2L Water');
  const otherHabits = habits.filter(h => h.name !== 'Drink 2L Water');

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Habit & Gym Tracker</h1>
            <p className="text-muted-foreground">Cultivate good habits and track your gym progress.</p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Habit
          </Button>
        </header>
        
        <Separator />
        <GymTracker />
        <Separator />

        <div className="space-y-4">
             <h2 className="text-xl font-bold font-headline">Daily Habits</h2>
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {waterHabit && <WaterIntakeManager habit={waterHabit} onUpdate={handleUpdateHabit} />}
                {otherHabits.map((habit) => (
                    <HabitGrid key={habit.id} habit={habit} onToggle={handleToggleCompletion} />
                ))}
             </div>
        </div>
      </div>
    </AppLayout>
  );
}
