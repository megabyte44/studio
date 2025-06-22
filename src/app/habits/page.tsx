
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Habit, Exercise, WorkoutDay, CyclicalWorkoutSplit, CycleConfig, ProteinIntake, LoggedFoodItem, CompletedWorkouts } from '@/types';
import { P_HABITS } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Flame, List, Dumbbell, CalendarDays, Edit, Beef, Apple, Settings, Trash2, Check, AlertTriangle, Droplets, Plus, Minus, BookOpen, BookOpenCheck } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { subDays, format, isSameDay, parseISO, startOfMonth, differenceInCalendarDays } from 'date-fns';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


// --- Initial Data for Gym Tracker ---
const initialWorkoutSplit: CyclicalWorkoutSplit = {
  "Day 1": { title: "Push Day (Chest, Shoulders, Triceps)", exercises: [{ name: "Bench Press", sets: "3-4", reps: "8-12" }, { name: "Overhead Press", sets: "3", reps: "8-12" }, { name: "Incline Dumbbell Press", sets: "3", reps: "10-15" }, { name: "Tricep Dips/Pushdowns", sets: "3", reps: "10-15" }, { name: "Lateral Raises", sets: "3", reps: "12-15" }] },
  "Day 2": { title: "Pull Day (Back, Biceps)", exercises: [{ name: "Pull-ups/Lat Pulldowns", sets: "3-4", reps: "6-12" }, { name: "Bent-over Rows", sets: "3", reps: "8-12" }, { name: "Seated Cable Rows", sets: "3", reps: "10-15" }, { name: "Barbell Curls", sets: "3", reps: "8-12" }, { name: "Face Pulls", sets: "3", reps: "15-20" }] },
  "Day 3": { title: "Leg Day (Quads, Hamstrings, Calves)", exercises: [{ name: "Squats", sets: "3-4", reps: "8-12" }, { name: "Romanian Deadlifts", sets: "3", reps: "10-12" }, { name: "Leg Press", sets: "3", reps: "10-15" }, { name: "Leg Curls", sets: "3", reps: "10-15" }, { name: "Calf Raises", sets: "3", reps: "15-20" }] },
  "Day 4 (Rest)": { title: "Rest or Active Recovery", exercises: [] },
};
const initialCustomFoodItems = ["Protein Powder", "Creatine", "Oatmeal", "Eggs", "Chicken Breast", "Greek Yogurt"];

type GymTrackerProps = {
  habits: Habit[];
  setHabits: (habits: Habit[]) => void;
  proteinIntakes: ProteinIntake[];
  setProteinIntakes: (intakes: ProteinIntake[]) => void;
  loggedFoodItems: LoggedFoodItem[];
  setLoggedFoodItems: (items: LoggedFoodItem[]) => void;
  proteinTarget: number;
  setProteinTarget: (target: number) => void;
  customFoodItems: string[];
  setCustomFoodItems: (items: string[]) => void;
  cyclicalWorkoutSplit: CyclicalWorkoutSplit;
  setCyclicalWorkoutSplit: (split: CyclicalWorkoutSplit) => void;
  cycleConfig: CycleConfig;
  setCycleConfig: (config: CycleConfig) => void;
};


function GymTracker({ 
    habits, setHabits, 
    proteinIntakes, setProteinIntakes, 
    loggedFoodItems, setLoggedFoodItems,
    proteinTarget, setProteinTarget,
    customFoodItems, onManageCustomFoodItems,
    cyclicalWorkoutSplit, cycleConfig,
    onToggleWorkoutCompletion,
    isTodayCompleted,
    todaysWorkoutInfo,
}: GymTrackerProps & { 
    onManageCustomFoodItems: () => void,
    onToggleWorkoutCompletion: () => void,
    isTodayCompleted: boolean,
    todaysWorkoutInfo: ReturnType<typeof useWorkoutDayInfo>
}) {
    
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
                            <CardTitle className="font-headline flex items-center gap-3 text-lg">
                                <List className="h-6 w-6 text-primary" />
                                <span>{todaysWorkoutInfo.key}: {todaysWorkoutInfo.title}</span>
                            </CardTitle>
                            <CardDescription>
                                Today ({format(new Date(), 'eeee, MMM d')})
                            </CardDescription>
                        </div>
                         <div className="flex gap-2">
                             <Button variant="ghost" size="icon"><CalendarDays className="h-5 w-5" /></Button>
                             <Button variant="ghost" size="icon"><Edit className="h-5 w-5" /></Button>
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
                            <Button className="w-full" onClick={onToggleWorkoutCompletion} variant={isTodayCompleted ? 'secondary' : 'default'}>
                                <Check className="mr-2 h-4 w-4"/>
                                {isTodayCompleted ? 'Workout Completed!' : "Mark Today's Workout as Done"}
                            </Button>
                        </CardFooter>
                    )}
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
                      onManageItems={onManageCustomFoodItems}
                    />
                </div>
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
                <CardTitle className="font-headline flex items-center gap-3 text-lg"><Beef className="h-6 w-6 text-primary" /> <span>Protein Intake</span></CardTitle>
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
                    <CardTitle className="font-headline flex items-center gap-3 text-lg"><Apple className="h-6 w-6 text-primary" /> <span>Food & Supplement Log</span></CardTitle>
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
  if (!habit || habit.name !== 'Water Drinking') return null;

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
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-2 text-center">
        <p className="text-sm text-muted-foreground px-4">
            Log your daily water intake. Each glass is 250ml. Your goal is 2L ({TARGET_GLASSES} glasses).
        </p>
        <div className="flex items-center justify-center gap-4">
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
        </div>
    </div>
  )
}

function HabitGrid({ habit, onToggle }: { habit: Habit; onToggle: (habitId: string, date: string) => void }) {
  const today = new Date();
  const days = Array.from({ length: 30 }).map((_, i) => subDays(today, i)).reverse();
  const isWaterHabit = habit.name === 'Water Drinking';
  const WATER_TARGET_GLASSES = 8;

  const getIsCompleted = (dateString: string) => {
    const completion = habit.completions[dateString];
    if (isWaterHabit) {
      return typeof completion === 'number' && completion >= WATER_TARGET_GLASSES;
    }
    return !!completion;
  };

  return (
    <TooltipProvider>
        <div className="mx-auto grid w-fit grid-cols-6 gap-1.5 p-4 pt-2">
            {days.map((day) => {
                const dateString = format(day, 'yyyy-MM-dd');
                const isCompleted = getIsCompleted(dateString);
                return (
                    <Tooltip key={dateString} delayDuration={0}>
                        <TooltipTrigger asChild>
                            <button
                                onClick={() => onToggle(habit.id, dateString)}
                                disabled={isWaterHabit}
                                className={cn(
                                    'h-7 w-7 rounded-sm transition-colors',
                                    isCompleted ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-accent',
                                    isSameDay(day, today) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                                    isWaterHabit && 'cursor-not-allowed'
                                )}
                            />
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{format(day, 'MMM d, yyyy')}</p>
                            {isWaterHabit && typeof habit.completions[dateString] === 'number' && (
                                <p className="text-xs text-muted-foreground">{habit.completions[dateString]} glasses</p>
                            )}
                        </TooltipContent>
                    </Tooltip>
                );
            })}
        </div>
    </TooltipProvider>
  );
}

function EditHabitDialog({
  habit,
  isOpen,
  onOpenChange,
  onSave,
}: {
  habit: Habit | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (habitId: string, newName: string) => void;
}) {
  const { toast } = useToast();
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (habit) {
      setNewName(habit.name);
    }
  }, [habit]);

  const handleSave = () => {
    if (!newName.trim()) {
      toast({
        title: 'Name cannot be empty',
        description: 'Please provide a name for the habit.',
        variant: 'destructive',
      });
      return;
    }
    if (habit) {
      onSave(habit.id, newName.trim());
      onOpenChange(false);
      toast({ title: 'Habit Renamed', description: `Your habit has been renamed to "${newName.trim()}".` });
    }
  };

  if (!habit) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
          <DialogDescription>
            Change the name of your habit. This won't affect your streak.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="habit-name" className="text-right">
              Name
            </Label>
            <Input
              id="habit-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="col-span-3"
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const useWorkoutDayInfo = (cyclicalWorkoutSplit: CyclicalWorkoutSplit, cycleConfig: CycleConfig) => {
    return useCallback((date: Date) => {
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
};


export default function HabitsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Core State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isEditHabitDialogOpen, setIsEditHabitDialogOpen] = useState(false);
  
  // Gym & Nutrition State (lifted up)
  const [proteinIntakes, setProteinIntakes] = useState<ProteinIntake[]>([]);
  const [loggedFoodItems, setLoggedFoodItems] = useState<LoggedFoodItem[]>([]);
  const [proteinTarget, setProteinTarget] = useState(150);
  const [customFoodItems, setCustomFoodItems] = useState<string[]>(initialCustomFoodItems);
  const [cyclicalWorkoutSplit, setCyclicalWorkoutSplit] = useState<CyclicalWorkoutSplit>(initialWorkoutSplit);
  const [cycleConfig, setCycleConfig] = useState<CycleConfig>({ startDate: format(new Date(), 'yyyy-MM-dd'), startDayKey: "Day 1" });

  // Dialog states for GymTracker
  const [isCycleConfigOpen, setIsCycleConfigOpen] = useState(false);
  const [isWorkoutPlanOpen, setIsWorkoutPlanOpen] = useState(false);
  const [isFoodManagerOpen, setIsFoodManagerOpen] = useState(false);

  // --- Effects for Loading Data ---
  useEffect(() => {
    try {
      let habitsToSet: Habit[] = [];
      const storedHabits = localStorage.getItem('lifeos_habits');
      if (storedHabits) {
        habitsToSet = JSON.parse(storedHabits);
      } else {
        habitsToSet = P_HABITS;
      }

      // De-duplicate habits based on name (case-insensitive) to prevent rendering issues from stale data
      if (Array.isArray(habitsToSet)) {
          const uniqueHabitsMap = new Map<string, Habit>();
          for (const habit of habitsToSet) {
              if (habit && habit.name) {
                  const normalizedName = habit.name.toLowerCase();
                  const existingHabit = uniqueHabitsMap.get(normalizedName);

                  // Prioritize keeping the 'Water Drinking' habit as it has special UI
                  if (normalizedName === 'water drinking') {
                      if (!existingHabit || habit.name === 'Water Drinking') {
                          uniqueHabitsMap.set(normalizedName, habit);
                      }
                  } else if (!existingHabit) {
                      uniqueHabitsMap.set(normalizedName, habit);
                  }
              }
          }
          habitsToSet = Array.from(uniqueHabitsMap.values());
      } else {
          habitsToSet = P_HABITS;
      }
      setHabits(habitsToSet);
      
      const storedCycleConfig = localStorage.getItem('gym_cycle_config');
      if(storedCycleConfig) setCycleConfig(JSON.parse(storedCycleConfig));
      
      const storedSplit = localStorage.getItem('gym_workout_split');
      if(storedSplit) setCyclicalWorkoutSplit(JSON.parse(storedSplit));

      const storedProteinTarget = localStorage.getItem('gym_protein_target');
      if(storedProteinTarget) setProteinTarget(JSON.parse(storedProteinTarget));

      const storedCustomFoods = localStorage.getItem('gym_custom_foods');
      if(storedCustomFoods) setCustomFoodItems(JSON.parse(storedCustomFoods));

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not load saved data." });
      setHabits(P_HABITS);
    }
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- Effects for Saving Data ---
  useEffect(() => {
    if (isLoading) return;
    localStorage.setItem('lifeos_habits', JSON.stringify(habits));
    localStorage.setItem('gym_cycle_config', JSON.stringify(cycleConfig));
    localStorage.setItem('gym_workout_split', JSON.stringify(cyclicalWorkoutSplit));
    localStorage.setItem('gym_protein_target', JSON.stringify(proteinTarget));
    localStorage.setItem('gym_custom_foods', JSON.stringify(customFoodItems));
  }, [habits, cycleConfig, cyclicalWorkoutSplit, proteinTarget, customFoodItems, isLoading]);

  // --- Habit Syncing Logic ---
  useEffect(() => {
    if (isLoading || !habits.length) return;

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    let habitsChanged = false;
    
    const newHabits = habits.map(habit => {
      let newCompletions = { ...habit.completions };
      let changed = false;

      // Sync Protein Streak
      if (habit.name === 'Protein Streak') {
        const totalProtein = proteinIntakes.reduce((sum, intake) => sum + intake.amount, 0);
        const isCompleted = totalProtein >= proteinTarget;
        if (!!newCompletions[todayKey] !== isCompleted) {
          if (isCompleted) newCompletions[todayKey] = true;
          else delete newCompletions[todayKey];
          changed = true;
        }
      }

      // Sync Supplement Streak
      if (habit.name === 'Supplement Streak') {
        const todaysLogs = loggedFoodItems.filter(i => format(parseISO(i.timestamp), 'yyyy-MM-dd') === todayKey);
        const isCompleted = todaysLogs.length > 0;
        if (!!newCompletions[todayKey] !== isCompleted) {
          if (isCompleted) newCompletions[todayKey] = true;
          else delete newCompletions[todayKey];
          changed = true;
        }
      }

      if (changed) {
        habitsChanged = true;
        return { ...habit, completions: newCompletions };
      }
      return habit;
    });

    if (habitsChanged) {
      setHabits(newHabits);
    }

  }, [proteinIntakes, proteinTarget, loggedFoodItems, habits, isLoading, setHabits]);


  // --- Handlers ---
  const handleUpdateHabit = (updatedHabit: Habit) => {
    setHabits(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const handleToggleCompletion = (habitId: string, date: string) => {
    setHabits(habits.map(h => {
        if (h.id === habitId && h.name !== 'Water Drinking') {
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

  const handleSaveHabitName = (habitId: string, newName: string) => {
    setHabits((prevHabits) =>
      prevHabits.map((h) =>
        h.id === habitId ? { ...h, name: newName } : h
      )
    );
  };
  
  const getWorkoutDayInfo = useWorkoutDayInfo(cyclicalWorkoutSplit, cycleConfig);
  const todaysWorkoutInfo = useMemo(() => getWorkoutDayInfo(new Date()), [getWorkoutDayInfo]);
  
  const workoutHabit = habits.find(h => h.name === 'Workout');
  const todayKey = format(new Date(), 'yyyy-MM-dd');
  const isTodayWorkoutCompleted = workoutHabit ? !!workoutHabit.completions[todayKey] : false;

  const handleToggleWorkoutCompletion = () => {
    if (!workoutHabit) {
        toast({ variant: 'destructive', title: 'Error', description: 'Workout habit not found.' });
        return;
    }
    const updatedHabits = habits.map(h => {
        if (h.id === workoutHabit.id) {
            const newCompletions = { ...h.completions };
            if (isTodayWorkoutCompleted) {
                delete newCompletions[todayKey];
            } else {
                newCompletions[todayKey] = true;
            }
            return { ...h, completions: newCompletions };
        }
        return h;
    });
    setHabits(updatedHabits);
    toast({ title: !isTodayWorkoutCompleted ? 'Workout Completed!' : 'Workout marked as not done.' });
  };


  const WATER_TARGET_GLASSES = 8;
  
  if (isLoading) {
    return (
        <AppLayout>
            <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-64 w-full" />
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-80 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        </AppLayout>
    );
  }

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
        
        <GymTracker 
            habits={habits}
            setHabits={setHabits}
            proteinIntakes={proteinIntakes}
            setProteinIntakes={setProteinIntakes}
            loggedFoodItems={loggedFoodItems}
            setLoggedFoodItems={setLoggedFoodItems}
            proteinTarget={proteinTarget}
            setProteinTarget={setProteinTarget}
            customFoodItems={customFoodItems}
            setCustomFoodItems={setCustomFoodItems}
            cyclicalWorkoutSplit={cyclicalWorkoutSplit}
            setCyclicalWorkoutSplit={setCyclicalWorkoutSplit}
            cycleConfig={cycleConfig}
            setCycleConfig={setCycleConfig}
            onManageCustomFoodItems={() => setIsFoodManagerOpen(true)}
            onToggleWorkoutCompletion={handleToggleWorkoutCompletion}
            isTodayCompleted={isTodayWorkoutCompleted}
            todaysWorkoutInfo={todaysWorkoutInfo}
        />

        <Separator />

        <div className="space-y-4">
            <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                <BookOpenCheck className="h-6 w-6 text-primary" />
                <span>Streak Book</span>
            </h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
                {habits.map((habit) => {
                    const Icon = (LucideIcons as any)[habit.icon] || LucideIcons.CheckCircle2;
                    const isWaterHabit = habit.name === 'Water Drinking';
                    const streak = calculateStreak(
                        habit.completions,
                        isWaterHabit ? WATER_TARGET_GLASSES : 1
                    );

                    return (
                        <Card key={habit.id} className="group">
                            <AccordionItem value={habit.id} className="border-b-0">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-6 w-6 text-muted-foreground" />
                                            <span className="font-semibold text-base">{habit.name}</span>
                                            <div
                                                role="button"
                                                aria-label="Edit habit"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md hover:bg-accent cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingHabit(habit);
                                                    setIsEditHabitDialogOpen(true);
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.stopPropagation();
                                                        setEditingHabit(habit);
                                                        setIsEditHabitDialogOpen(true);
                                                    }
                                                }}
                                            >
                                                <Edit className="h-3 w-3" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-orange-500">
                                            <Flame className="h-5 w-5" />
                                            <span className="font-bold text-lg">{streak} Day{streak !== 1 ? 's' : ''}</span>
                                        </div>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                    {isWaterHabit ? (
                                        <>
                                            <WaterIntakeManager habit={habit} onUpdate={handleUpdateHabit} />
                                            <HabitGrid habit={habit} onToggle={handleToggleCompletion} />
                                        </>
                                    ) : (
                                        <HabitGrid habit={habit} onToggle={handleToggleCompletion} />
                                    )}
                                </AccordionContent>
                            </AccordionItem>
                        </Card>
                    );
                })}
            </Accordion>
        </div>
      </div>
      <EditHabitDialog
        habit={editingHabit}
        isOpen={isEditHabitDialogOpen}
        onOpenChange={setIsEditHabitDialogOpen}
        onSave={handleSaveHabitName}
      />
    </AppLayout>
  );
}
