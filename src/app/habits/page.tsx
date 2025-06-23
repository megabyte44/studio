
'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Habit, Exercise, WorkoutDay, CyclicalWorkoutSplit, CycleConfig, ProteinIntake, LoggedFoodItem, CompletedWorkouts, ExerciseSession } from '@/types';
import { P_HABITS } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    PlusCircle, Flame, List, Dumbbell, CalendarDays, Edit, Beef, Apple, Settings, Trash2, Check, 
    AlertTriangle, Droplets, Plus, Minus, BookOpenCheck, Pill, Bed, Footprints, 
    Sunrise, Guitar, Code, Leaf, CheckCircle2, GlassWater, CalendarIcon, TrendingUp, BarChart2, ChevronDown
} from 'lucide-react';
import { subDays, format, isSameDay, parseISO, startOfMonth, differenceInCalendarDays } from 'date-fns';
import { calculateStreak, cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Calendar } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from 'recharts';


const iconMap: Record<string, React.ElementType> = {
    PlusCircle, Flame, List, Dumbbell, CalendarDays, Edit, Beef, Apple, Settings, Trash2, Check, 
    AlertTriangle, Droplets, Plus, Minus, BookOpenCheck, Pill, Bed, Footprints, 
    Sunrise, Guitar, Code, Leaf, CheckCircle2, GlassWater, TrendingUp
};

// --- Augment initial data with IDs and overload properties ---
const augmentWorkoutSplit = (split: CyclicalWorkoutSplit): CyclicalWorkoutSplit => {
    const newSplit: CyclicalWorkoutSplit = {};
    Object.entries(split).forEach(([dayKey, dayData]) => {
        newSplit[dayKey] = {
            ...dayData,
            exercises: dayData.exercises.map(ex => ({
                id: ex.id || `ex-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                ...ex,
                kValue: ex.kValue || 0.5,
                baselineWeight: ex.baselineWeight || 0,
                baselineReps: ex.baselineReps || 0,
                targetWeight: ex.targetWeight || 0,
                targetReps: ex.targetReps || 0,
                sessionHistory: ex.sessionHistory || [],
            }))
        };
    });
    return newSplit;
};

// --- Initial Data for Gym Tracker ---
const initialWorkoutSplitRaw: CyclicalWorkoutSplit = {
  "Day 1": { title: "Push Day (Chest, Shoulders, Triceps)", exercises: [{ id: 'ex-1', name: "Bench Press", sets: "3-4" }, { id: 'ex-2', name: "Overhead Press", sets: "3" }, { id: 'ex-3', name: "Incline Dumbbell Press", sets: "3" }, { id: 'ex-4', name: "Tricep Dips/Pushdowns", sets: "3" }, { id: 'ex-5', name: "Lateral Raises", sets: "3" }] },
  "Day 2": { title: "Pull Day (Back, Biceps)", exercises: [{ id: 'ex-6', name: "Pull-ups/Lat Pulldowns", sets: "3-4" }, { id: 'ex-7', name: "Bent-over Rows", sets: "3" }, { id: 'ex-8', name: "Seated Cable Rows", sets: "3" }, { id: 'ex-9', name: "Barbell Curls", sets: "3" }, { id: 'ex-10', name: "Face Pulls", sets: "3" }] },
  "Day 3": { title: "Leg Day (Quads, Hamstrings, Calves)", exercises: [{ id: 'ex-11', name: "Squats", sets: "3-4" }, { id: 'ex-12', name: "Romanian Deadlifts", sets: "3" }, { id: 'ex-13', name: "Leg Press", sets: "3" }, { id: 'ex-14', name: "Leg Curls", sets: "3" }, { id: 'ex-15', name: "Calf Raises", sets: "3" }] },
  "Day 4 (Rest)": { title: "Rest or Active Recovery", exercises: [] },
};
const initialWorkoutSplit = augmentWorkoutSplit(initialWorkoutSplitRaw);
const initialCustomFoodItems = ["Protein Powder", "Creatine", "Oatmeal", "Eggs", "Chicken Breast", "Greek Yogurt"];
const SPECIAL_HABIT_ICONS = ['GlassWater', 'Dumbbell', 'Beef', 'Pill'];

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
  onOpenOverloadTracker: () => void;
};


function GymTracker({ 
    habits, setHabits, 
    proteinIntakes, setProteinIntakes, 
    loggedFoodItems, setLoggedFoodItems,
    proteinTarget, setProteinTarget,
    customFoodItems, setCustomFoodItems,
    onManageCustomFoodItems,
    cyclicalWorkoutSplit, setCyclicalWorkoutSplit,
    cycleConfig, setCycleConfig,
    onToggleWorkoutCompletion,
    isTodayCompleted,
    todaysWorkoutInfo,
    onManagePlan,
    onOpenOverloadTracker,
}: GymTrackerProps & { 
    onManageCustomFoodItems: () => void,
    onManagePlan: () => void,
    onToggleWorkoutCompletion: () => void,
    isTodayCompleted: boolean,
    todaysWorkoutInfo: ReturnType<typeof useWorkoutDayInfo>
}) {
    
    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                    <Dumbbell className="h-6 w-6 text-primary" />
                    <span>Gym Tracker</span>
                </h2>
                <Button variant="ghost" size="icon" onClick={onManagePlan}>
                    <Settings className="h-5 w-5" />
                </Button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className={cn("lg:col-span-3", isTodayCompleted && "bg-muted/50")}>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="font-headline flex items-center gap-3 text-lg">
                                <span>{todaysWorkoutInfo.key}: {todaysWorkoutInfo.title}</span>
                            </CardTitle>
                        </div>
                         <CardDescription>
                            Today ({format(new Date(), 'EEEE, MMM d')})
                         </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {todaysWorkoutInfo.exercises.length > 0 ? (
                            <ul className="space-y-3">
                                {todaysWorkoutInfo.exercises.map((ex, i) => (
                                    <li key={i} className="flex justify-between items-center p-3 rounded-md bg-muted/30">
                                        <span className="font-semibold">{ex.name}</span>
                                        <span className="text-sm text-muted-foreground">Sets: {ex.sets}</span>
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

                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle className="font-headline flex items-center gap-3 text-lg">
                            <TrendingUp className="h-6 w-6 text-primary" />
                            <span>Overload Tracker</span>
                        </CardTitle>
                        <CardDescription>
                            Analyze and visualize your strength progression for key exercises.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={onOpenOverloadTracker}>
                            <BarChart2 className="mr-2 h-4 w-4" />
                            Track Progress
                        </Button>
                    </CardContent>
                </Card>
                 
                <div className="lg:col-span-3 grid md:grid-cols-2 gap-6">
                    <ProteinTrackerCard 
                      intakes={proteinIntakes}
                      setIntakes={setProteinIntakes}
                      target={proteinTarget}
                      setTarget={setProteinTarget}
                    />

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

function ProteinTrackerCard({ intakes, setIntakes, target, setTarget }: {
    intakes: ProteinIntake[],
    setIntakes: (intakes: ProteinIntake[]) => void,
    target: number,
    setTarget: (target: number) => void
}) {
    const { toast } = useToast();
    const [amount, setAmount] = useState('');
    const todayKey = format(new Date(), 'yyyy-MM-dd');

    const todaysIntakes = useMemo(() => {
        return intakes.filter((intake: ProteinIntake) => format(parseISO(intake.timestamp), 'yyyy-MM-dd') === todayKey);
    }, [intakes, todayKey]);

    const totalProtein = useMemo(() => todaysIntakes.reduce((sum: number, intake: ProteinIntake) => sum + intake.amount, 0), [todaysIntakes]);
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
                <CardDescription>Today's Total: {totalProtein}g / {target}g</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="proteinTarget" className="text-sm">Daily Protein Target (g)</Label>
                    <Input id="proteinTarget" type="number" value={target} onChange={e => setTarget(Number(e.target.value))} placeholder="e.g., 150" />
                </div>
                <Progress value={progress} />
                 <div className="flex gap-2">
                    <Input type="number" placeholder="Log Protein (g)" value={amount} onChange={e => setAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogProtein()} />
                    <Button onClick={handleLogProtein}><PlusCircle className="h-4 w-4" /></Button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-2">
                    {todaysIntakes.length > 0 ? [...todaysIntakes].reverse().map((intake: ProteinIntake) => (
                        <div key={intake.id} className="flex justify-between items-center text-sm bg-muted p-2 rounded-md">
                           <span>{intake.amount}g at {format(parseISO(intake.timestamp), 'h:mm a')}</span>
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(intake.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center pt-4">No protein logged today.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function FoodLogCard({ loggedItems, setLoggedItems, customItems, onManageItems }: {
    loggedItems: LoggedFoodItem[],
    setLoggedItems: (items: LoggedFoodItem[]) => void,
    customItems: string[],
    onManageItems: () => void
}) {
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
                     {todaysLoggedItems.length > 0 ? [...todaysLoggedItems].reverse().map((item: LoggedFoodItem) => (
                        <div key={item.id} className="flex justify-between items-center text-sm bg-muted p-2 rounded-md">
                           <span>{item.name} at {format(parseISO(item.timestamp), 'h:mm a')}</span>
                           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    )) : <p className="text-sm text-muted-foreground text-center pt-4">No items logged yet today.</p>}
                </div>
            </CardContent>
        </Card>
    );
}

function WaterIntakeManager({ habit, onUpdate }: { habit: Habit; onUpdate: (habit: Habit) => void }) {
  if (!habit || habit.icon !== 'GlassWater') return null;

  const ML_PER_GLASS = 250;
  const currentTargetInGlasses = habit.target || 8; 

  const handleTargetChange = (increment: number) => {
    const newTarget = Math.max(1, currentTargetInGlasses + increment); 
    onUpdate({ ...habit, target: newTarget });
  };
  
  return (
    <div className="flex flex-col items-center justify-center gap-4 pt-2 text-center">
        <div className="flex items-center justify-center gap-4">
            <Button onClick={() => handleTargetChange(-1)} variant="outline" size="icon" disabled={currentTargetInGlasses <= 1}>
                <Minus className="h-4 w-4" />
            </Button>
            <div className="text-center">
                <p className="text-lg font-bold font-headline" style={{ fontSize: '18px' }}>{currentTargetInGlasses} glasses</p>
                <p className="text-sm text-muted-foreground">({currentTargetInGlasses * ML_PER_GLASS}ml)</p>
            </div>
            <Button onClick={() => handleTargetChange(1)} variant="outline" size="icon">
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    </div>
  )
}

function HabitGrid({ habit, onToggle }: { habit: Habit; onToggle: (habitId: string, date: string) => void }) {
  const today = new Date();
  const days = Array.from({ length: 30 }).map((_, i) => subDays(today, i)).reverse();
  const isSyncedHabit = SPECIAL_HABIT_ICONS.includes(habit.icon);
  const isWaterHabit = habit.icon === 'GlassWater';

  const getIsCompleted = (dateString: string) => {
    const completion = habit.completions[dateString];
    if (isWaterHabit) {
      const target = habit.target || 8;
      return typeof completion === 'number' && completion >= target;
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
                                disabled={isSyncedHabit}
                                className={cn(
                                    'h-7 w-7 rounded-sm transition-colors',
                                    isCompleted ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-accent',
                                    isSameDay(day, today) && 'ring-2 ring-primary ring-offset-2 ring-offset-background',
                                    isSyncedHabit && 'cursor-not-allowed'
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
             startIndexInCycle = 0;
        }
        const currentDayIndexInCycle = (startIndexInCycle + daysSinceStart) % cycleLength;
        const workoutKey = cycleWorkoutKeys[currentDayIndexInCycle];
        const workoutData = cyclicalWorkoutSplit[workoutKey] || { title: "Undefined Workout", exercises: [] };
        const isRestDay = workoutData.exercises.length === 0 || workoutData.title.toLowerCase().includes("rest");

        return { key: workoutKey, ...workoutData, isRestDay };
    }, [cyclicalWorkoutSplit, cycleConfig]);
};


function OverloadSetup({ exercise, onExerciseChange }: { exercise: Exercise, onExerciseChange: (field: keyof Exercise, value: any) => void }) {
    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="overload-setup" className="border-none">
                <AccordionTrigger className="py-1 hover:no-underline justify-end text-foreground [&>svg]:text-black">
                     <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
                </AccordionTrigger>
                <AccordionContent className="space-y-1.5 pt-1">
                    <div>
                        <Label htmlFor={`k-value-${exercise.id}`} className="text-xs">Exercise Type (k-Value)</Label>
                        <Select value={String(exercise.kValue || 0.5)} onValueChange={(v) => onExerciseChange('kValue', parseFloat(v))}>
                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="0.3" className="text-xs">Isolation (e.g., Curl)</SelectItem>
                                <SelectItem value="0.5" className="text-xs">Compound (e.g., Bench Press)</SelectItem>
                                <SelectItem value="0.6" className="text-xs">Heavy Compound (e.g., Squat)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <div><Label htmlFor={`base-weight-${exercise.id}`} className="text-xs">Baseline Weight (kg)</Label><Input id={`base-weight-${exercise.id}`} type="number" value={exercise.baselineWeight || ''} onChange={(e) => onExerciseChange('baselineWeight', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                        <div><Label htmlFor={`base-reps-${exercise.id}`} className="text-xs">Baseline Reps</Label><Input id={`base-reps-${exercise.id}`} type="number" value={exercise.baselineReps || ''} onChange={(e) => onExerciseChange('baselineReps', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                        <div><Label htmlFor={`target-weight-${exercise.id}`} className="text-xs">Target Weight (kg)</Label><Input id={`target-weight-${exercise.id}`} type="number" value={exercise.targetWeight || ''} onChange={(e) => onExerciseChange('targetWeight', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                        <div><Label htmlFor={`target-reps-${exercise.id}`} className="text-xs">Target Reps</Label><Input id={`target-reps-${exercise.id}`} type="number" value={exercise.targetReps || ''} onChange={(e) => onExerciseChange('targetReps', parseFloat(e.target.value))} className="h-7 text-xs" /></div>
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

function GymSettingsDialog({
  isOpen,
  onOpenChange,
  workoutSplit,
  cycleConfig,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  workoutSplit: CyclicalWorkoutSplit;
  cycleConfig: CycleConfig;
  onSave: (newSplit: CyclicalWorkoutSplit, newConfig: CycleConfig) => void;
}) {
  const [editedSplit, setEditedSplit] = useState<CyclicalWorkoutSplit>({});
  const [editedConfig, setEditedConfig] = useState<CycleConfig>({
    startDate: '',
    startDayKey: '',
  });

  useEffect(() => {
    if (isOpen) {
      setEditedSplit(JSON.parse(JSON.stringify(workoutSplit)));
      setEditedConfig(JSON.parse(JSON.stringify(cycleConfig)));
    }
  }, [isOpen, workoutSplit, cycleConfig]);

  const handleDayTitleChange = (dayKey: string, newTitle: string) => {
    setEditedSplit((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], title: newTitle },
    }));
  };

  const handleExerciseChange = (
    dayKey: string,
    exIndex: number,
    field: keyof Exercise,
    value: any
  ) => {
    setEditedSplit((prev) => {
      const newSplit = JSON.parse(JSON.stringify(prev));
      const exercise = newSplit[dayKey].exercises[exIndex];
      if (typeof value === 'number' && isNaN(value)) {
        exercise[field] = undefined;
      } else {
        exercise[field] = value;
      }
      return newSplit;
    });
  };

  const handleAddExercise = (dayKey: string) => {
    setEditedSplit((prev) => {
      const newSplit = { ...prev };
      const newExercise: Exercise = {
        id: crypto.randomUUID(),
        name: 'New Exercise',
        sets: '3-4',
        kValue: 0.5,
        baselineWeight: 0,
        baselineReps: 0,
        targetWeight: 0,
        targetReps: 0,
        sessionHistory: [],
      };
      newSplit[dayKey].exercises.push(newExercise);
      return newSplit;
    });
  };

  const handleDeleteExercise = (dayKey: string, exIndex: number) => {
    setEditedSplit((prev) => {
      const newSplit = { ...prev };
      newSplit[dayKey].exercises.splice(exIndex, 1);
      return newSplit;
    });
  };

  const handleAddDay = () => {
    setEditedSplit((prev) => {
      const newDayKey = `Day ${Object.keys(prev).length + 1}`;
      return { ...prev, [newDayKey]: { title: 'New Workout Day', exercises: [] } };
    });
  };

  const handleDeleteDay = (dayKey: string) => {
    setEditedSplit((prev) => {
      const newSplit = { ...prev };
      delete newSplit[dayKey];
      // Also unset startDayKey if it was the deleted day
      if (editedConfig.startDayKey === dayKey) {
        setEditedConfig((c) => ({ ...c, startDayKey: '' }));
      }
      return newSplit;
    });
  };

  const handleSaveChanges = () => {
    onSave(editedSplit, editedConfig);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-lg rounded-lg flex flex-col h-[80vh] p-0">
        <DialogHeader className="p-2 border-b flex-shrink-0">
          <DialogTitle className="text-base">Manage Gym Plan</DialogTitle>
          <DialogDescription className="text-xs">
            Edit your workout plan and cycle configuration.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow">
          <div className="p-2">
            <Tabs defaultValue="plan" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="plan" className="text-xs px-2 py-1">
                  Workout Plan
                </TabsTrigger>
                <TabsTrigger value="cycle" className="text-xs px-2 py-1">
                  Cycle Configuration
                </TabsTrigger>
              </TabsList>
              <TabsContent value="plan" className="mt-2">
                <Accordion type="multiple" className="w-full space-y-1">
                  {Object.entries(editedSplit).map(([dayKey, dayData]) => (
                    <AccordionItem
                      value={dayKey}
                      key={dayKey}
                      className="border rounded-md px-2"
                    >
                      <AccordionTrigger className="py-1.5 hover:no-underline">
                        <div className="flex justify-between items-center w-full">
                          <span className="text-xs font-medium">
                            {dayKey}: {dayData.title}
                          </span>
                           <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="mr-2 h-6 w-6"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDay(dayKey);
                                }}
                              >
                                <span>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </span>
                            </Button>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-2 pb-2">
                        <div>
                          <Label
                            htmlFor={`title-${dayKey}`}
                            className="text-xs"
                          >
                            Day Title
                          </Label>
                          <Input
                            id={`title-${dayKey}`}
                            value={dayData.title}
                            onChange={(e) =>
                              handleDayTitleChange(dayKey, e.target.value)
                            }
                            className="h-7 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-xs">Exercises</h4>
                           <ScrollArea className="max-h-64 pr-2">
                            <div className="space-y-1">
                              {dayData.exercises.map((ex, exIndex) => (
                                <div key={ex.id || exIndex} className="border-t pt-2">
                                  <div className="flex items-center gap-1">
                                    <Input
                                      placeholder="Name"
                                      value={ex.name}
                                      onChange={(e) =>
                                        handleExerciseChange(
                                          dayKey,
                                          exIndex,
                                          'name',
                                          e.target.value
                                        )
                                      }
                                      className="flex-grow h-7 text-xs"
                                    />
                                    <Input
                                      placeholder="Sets"
                                      value={ex.sets}
                                      onChange={(e) =>
                                        handleExerciseChange(
                                          dayKey,
                                          exIndex,
                                          'sets',
                                          e.target.value
                                        )
                                      }
                                      className="w-16 h-7 text-xs"
                                    />
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      onClick={() =>
                                        handleDeleteExercise(dayKey, exIndex)
                                      }
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                  <OverloadSetup
                                    exercise={ex}
                                    onExerciseChange={(field, value) =>
                                      handleExerciseChange(
                                        dayKey,
                                        exIndex,
                                        field,
                                        value
                                      )
                                    }
                                  />
                                </div>
                              ))}
                            </div>
                           </ScrollArea>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-xs"
                            onClick={() => handleAddExercise(dayKey)}
                          >
                            Add Exercise
                          </Button>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-2 h-7 px-2 text-xs"
                  onClick={handleAddDay}
                >
                  Add Workout Day
                </Button>
              </TabsContent>
              <TabsContent value="cycle" className="mt-2">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Cycle Start Date</Label>
                    <p className="text-xs text-muted-foreground">
                      Select the date your cycle begins.
                    </p>
                    <Calendar
                      mode="single"
                      selected={
                        editedConfig.startDate
                          ? parseISO(editedConfig.startDate)
                          : new Date()
                      }
                      onSelect={(date) =>
                        date &&
                        setEditedConfig((prev) => ({
                          ...prev,
                          startDate: format(date, 'yyyy-MM-dd'),
                        }))
                      }
                      className="rounded-md border p-0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">
                      Starting Day of Cycle
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Select which workout corresponds to the start date.
                    </p>
                    <Select
                      value={editedConfig.startDayKey}
                      onValueChange={(value) =>
                        setEditedConfig((prev) => ({
                          ...prev,
                          startDayKey: value,
                        }))
                      }
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue placeholder="Select a day" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(editedSplit).map((dayKey) => (
                          <SelectItem
                            key={dayKey}
                            value={dayKey}
                            className="text-xs"
                          >
                            {dayKey}: {editedSplit[dayKey].title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>
        <DialogFooter className="p-2 border-t flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleSaveChanges}
          >
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FoodManagerDialog({
    isOpen,
    onOpenChange,
    customItems,
    onSave,
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    customItems: string[];
    onSave: (items: string[]) => void;
}) {
    const { toast } = useToast();
    const [editedItems, setEditedItems] = useState(customItems);
    const [newItem, setNewItem] = useState('');

    useEffect(() => {
        if(isOpen) {
            setEditedItems(customItems);
        }
    }, [isOpen, customItems]);

    const handleAddItem = () => {
        if (!newItem.trim()) {
            toast({ title: 'Item name cannot be empty', variant: 'destructive' });
            return;
        }
        if (editedItems.map(i => i.toLowerCase()).includes(newItem.trim().toLowerCase())) {
            toast({ title: 'Item already exists', variant: 'destructive' });
            return;
        }
        setEditedItems([...editedItems, newItem.trim()]);
        setNewItem('');
    };

    const handleDeleteItem = (itemToDelete: string) => {
        setEditedItems(editedItems.filter(item => item !== itemToDelete));
    };

    const handleSave = () => {
        onSave(editedItems);
        onOpenChange(false);
        toast({ title: 'Quick-Log Items Updated!' });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Manage Quick-Log Items</DialogTitle>
                    <DialogDescription>
                        Add or remove food and supplement items for quick logging.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="flex gap-2">
                        <Input
                            placeholder="e.g., Creatine"
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddItem();
                            }}
                        />
                        <Button onClick={handleAddItem}><Plus className="h-4 w-4" /> Add</Button>
                    </div>
                    <Separator />
                    <ScrollArea className="h-64">
                        <div className="space-y-2 pr-4">
                            {editedItems.length > 0 ? (
                                editedItems.map(item => (
                                    <div key={item} className="flex items-center justify-between rounded-md bg-muted p-2">
                                        <span className="text-sm font-medium">{item}</span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 text-destructive"
                                            onClick={() => handleDeleteItem(item)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-sm text-muted-foreground pt-8">
                                    No custom items yet.
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function OverloadTrackerDialog({
    isOpen, onOpenChange, workoutSplit, setWorkoutSplit
}: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    workoutSplit: CyclicalWorkoutSplit;
    setWorkoutSplit: (split: CyclicalWorkoutSplit) => void;
}) {
    const { toast } = useToast();
    const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
    const [sessionWeight, setSessionWeight] = useState('');
    const [sessionReps, setSessionReps] = useState('');

    const allExercises = useMemo(() => {
        return Object.values(workoutSplit).flatMap(day => day.exercises);
    }, [workoutSplit]);

    const selectedExercise = useMemo(() => {
        return allExercises.find(ex => ex.id === selectedExerciseId) || null;
    }, [selectedExerciseId, allExercises]);

    // --- Core Logic Engine ---
    const calculateE1RM = (weight: number, reps: number) => weight * (1 + reps / 30);

    const calculateProgressiveOverload = useCallback((
        sessionHistory: ExerciseSession[], 
        baseline: { weight: number; reps: number }, 
        target: { weight: number; reps: number }, 
        k: number
    ) => {
        const { weight: WL, reps: RL } = baseline;
        const { weight: WT, reps: RT } = target;
        const e1RM_L = calculateE1RM(WL, RL);
        const e1RM_T = calculateE1RM(WT, RT);
        const intensityRange = e1RM_T - e1RM_L;
        const weightRange = WT - WL;
        const repRange = RT - RL;
        let lastScore = 0;
        
        const results = [{ session: 1, weight: WL, reps: RL, score: 0, scoreDelta: 0 }];
        
        sessionHistory.forEach((session, index) => {
            const { weight: Wi, reps: Ri } = session;
            const e1RM_i = calculateE1RM(Wi, Ri);
            
            let intensityScore = (intensityRange > 0) ? (e1RM_i - e1RM_L) / intensityRange : (e1RM_i >= e1RM_L ? 1 : 0);
            intensityScore = Math.max(0, intensityScore);
            
            let weightProgress = (weightRange !== 0) ? (Wi - WL) / weightRange : (Wi >= WL ? 1 : 0);
            let repProgress = (repRange !== 0) ? (Ri - RL) / repRange : (Ri >= RL ? 1 : 0);
            
            weightProgress = Math.max(0, weightProgress);
            repProgress = Math.max(0, repProgress);
            
            const synergyScore = Math.sqrt(weightProgress * repProgress);
            const currentScore = (k * intensityScore) + ((1 - k) * synergyScore);
            const scoreDelta = currentScore - lastScore;
            
            results.push({ session: index + 2, weight: Wi, reps: Ri, score: currentScore, scoreDelta: scoreDelta });
            lastScore = currentScore;
        });
        
        return results;
    }, []);

    const overloadResults = useMemo(() => {
        if (!selectedExercise || !selectedExercise.sessionHistory) return [];
        const settings = {
            baseline: { weight: selectedExercise.baselineWeight || 0, reps: selectedExercise.baselineReps || 0 },
            target: { weight: selectedExercise.targetWeight || 0, reps: selectedExercise.targetReps || 0 },
            k: selectedExercise.kValue || 0.5
        };
        if (!settings.baseline.weight) return [];
        return calculateProgressiveOverload(selectedExercise.sessionHistory, settings.baseline, settings.target, settings.k);
    }, [selectedExercise, calculateProgressiveOverload]);

    const handleAddSession = () => {
        const weight = parseFloat(sessionWeight);
        const reps = parseInt(sessionReps);

        if (!selectedExerciseId || isNaN(weight) || isNaN(reps) || weight <= 0 || reps <= 0) {
            toast({ title: "Invalid Input", description: "Please enter valid, positive numbers for weight and reps.", variant: "destructive" });
            return;
        }

        const newSession: ExerciseSession = { weight, reps };
        const newSplit = JSON.parse(JSON.stringify(workoutSplit));
        
        let exerciseFound = false;
        for (const dayKey in newSplit) {
            const day = newSplit[dayKey];
            const exIndex = day.exercises.findIndex((ex: Exercise) => ex.id === selectedExerciseId);
            if (exIndex !== -1) {
                if (!day.exercises[exIndex].sessionHistory) {
                    day.exercises[exIndex].sessionHistory = [];
                }
                day.exercises[exIndex].sessionHistory.push(newSession);
                exerciseFound = true;
                break;
            }
        }

        if (exerciseFound) {
            setWorkoutSplit(newSplit);
            setSessionWeight('');
            setSessionReps('');
            toast({ title: "Session Logged!", description: `Added ${weight}kg x ${reps} reps for ${selectedExercise?.name}.` });
        }
    };
    
    const latestResult = overloadResults[overloadResults.length - 1];
    let feedbackText = "Log a session to see feedback.";
    let feedbackClass = "";
    if (latestResult && latestResult.session > 1) {
        if (latestResult.scoreDelta > 0.02) { feedbackText = "Great Progress! ▲"; feedbackClass = 'text-green-600'; } 
        else if (latestResult.scoreDelta > 0) { feedbackText = "Solid Improvement ▲"; feedbackClass = 'text-green-500'; } 
        else if (latestResult.scoreDelta === 0) { feedbackText = "Stable Performance –"; } 
        else { feedbackText = "Slight Dip ▼"; feedbackClass = 'text-red-500'; }
    }


    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Progressive Overload Tracker</DialogTitle>
                </DialogHeader>
                <div className="flex-grow grid md:grid-cols-2 gap-4 p-4 overflow-y-auto">
                    {/* Left Column: Controls & Feedback */}
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Select Exercise to Track</Label>
                             <Select onValueChange={setSelectedExerciseId} value={selectedExerciseId || ""}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose an exercise..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(workoutSplit).map(([dayKey, day]) => (
                                       day.exercises.length > 0 && (
                                        <React.Fragment key={dayKey}>
                                            <Label className="px-2 text-xs text-muted-foreground">{day.title}</Label>
                                            {day.exercises.map(ex => (
                                                <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                                            ))}
                                        </React.Fragment>
                                       )
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        
                        {selectedExercise && (
                            <>
                                <Card>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-lg">Log New Session for {selectedExercise.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 space-y-2">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label htmlFor="session-weight">Weight (kg)</Label><Input id="session-weight" type="number" placeholder="e.g., 65" value={sessionWeight} onChange={e => setSessionWeight(e.target.value)} /></div>
                                            <div><Label htmlFor="session-reps">Reps</Label><Input id="session-reps" type="number" placeholder="e.g., 8" value={sessionReps} onChange={e => setSessionReps(e.target.value)} /></div>
                                        </div>
                                        <Button onClick={handleAddSession} className="w-full"><PlusCircle className="mr-2 h-4 w-4"/> Add Session</Button>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="p-4">
                                        <CardTitle className="text-lg">Latest Session Feedback</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 pt-0 text-center">
                                       {latestResult && latestResult.session > 1 ? (
                                           <>
                                            <div className="text-3xl font-bold text-primary">{latestResult.weight}kg x {latestResult.reps}</div>
                                            <div className={`text-lg font-semibold ${feedbackClass}`}>{feedbackText}</div>
                                           </>
                                       ) : <p className="text-muted-foreground">Log a session to see feedback, or check setup.</p>}
                                    </CardContent>
                                </Card>
                            </>
                        )}
                    </div>
                    {/* Right Column: Chart & History */}
                    <div className="space-y-4">
                       {selectedExercise && overloadResults.length > 0 && (
                        <>
                             <Card>
                                <CardHeader className="p-4"><CardTitle className="text-lg">Progress Trend</CardTitle></CardHeader>
                                <CardContent className="p-4 pt-0 h-64">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={overloadResults} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis dataKey="session" tickFormatter={(val) => `S${val}`} />
                                            <YAxis domain={[0, 'dataMax + 0.1']} />
                                            <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                                            <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>
                             <Card>
                                <CardHeader className="p-4"><CardTitle className="text-lg">Session History</CardTitle></CardHeader>
                                <CardContent className="p-4 pt-0">
                                    <ScrollArea className="h-64">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Session</TableHead>
                                                    <TableHead>Weight</TableHead>
                                                    <TableHead>Reps</TableHead>
                                                    <TableHead>Trend</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {overloadResults.map((r, i) => (
                                                    <TableRow key={i}>
                                                        <TableCell>{r.session}</TableCell>
                                                        <TableCell>{r.weight}kg</TableCell>
                                                        <TableCell>{r.reps}</TableCell>
                                                        <TableCell className={cn(r.scoreDelta > 0 && 'text-green-500', r.scoreDelta < 0 && 'text-red-500')}>
                                                            {i > 0 ? (r.scoreDelta > 0 ? '▲' : r.scoreDelta < 0 ? '▼' : '–') : '–'}
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </ScrollArea>
                                </CardContent>
                            </Card>
                        </>
                       )}
                       {!selectedExercise && <div className="flex items-center justify-center h-full text-muted-foreground">Please select an exercise to view its data.</div>}
                    </div>
                </div>
                <DialogFooter className="p-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function HabitsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Core State
  const [habits, setHabits] = useState<Habit[]>([]);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isEditHabitDialogOpen, setIsEditHabitDialogOpen] = useState(false);
  const [isAddHabitDialogOpen, setIsAddHabitDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);
  
  // Gym & Nutrition State (lifted up)
  const [proteinIntakes, setProteinIntakes] = useState<ProteinIntake[]>([]);
  const [loggedFoodItems, setLoggedFoodItems] = useState<LoggedFoodItem[]>([]);
  const [proteinTarget, setProteinTarget] = useState(150);
  const [customFoodItems, setCustomFoodItems] = useState<string[]>(initialCustomFoodItems);
  const [cyclicalWorkoutSplit, setCyclicalWorkoutSplit] = useState<CyclicalWorkoutSplit>(initialWorkoutSplit);
  const [cycleConfig, setCycleConfig] = useState<CycleConfig>({ startDate: format(new Date(), 'yyyy-MM-dd'), startDayKey: "Day 1" });

  // Dialog states for GymTracker
  const [isGymSettingsOpen, setIsGymSettingsOpen] = useState(false);
  const [isFoodManagerOpen, setIsFoodManagerOpen] = useState(false);
  const [isOverloadTrackerOpen, setIsOverloadTrackerOpen] = useState(false);

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
      
      if (Array.isArray(habitsToSet)) {
          const uniqueHabitsMap = new Map<string, Habit>();
          
          for (const habit of habitsToSet) {
              if (habit && habit.name && habit.icon) {
                  const isSpecial = SPECIAL_HABIT_ICONS.includes(habit.icon);
                  const key = isSpecial ? habit.icon : habit.name.toLowerCase();
                  if (!uniqueHabitsMap.has(key)) {
                      uniqueHabitsMap.set(key, habit);
                  }
              }
          }
          habitsToSet = Array.from(uniqueHabitsMap.values());
      } else {
          habitsToSet = P_HABITS;
      }
      
      P_HABITS.forEach(ph => {
          if (SPECIAL_HABIT_ICONS.includes(ph.icon)) {
              if (!habitsToSet.some(h => h.icon === ph.icon)) {
                  habitsToSet.push(ph);
              }
          }
      });
      
      setHabits(habitsToSet);
      
      const storedCycleConfig = localStorage.getItem('gym_cycle_config');
      if(storedCycleConfig) setCycleConfig(JSON.parse(storedCycleConfig));
      
      const storedSplit = localStorage.getItem('gym_workout_split');
      if(storedSplit) {
          // Augment loaded data with new fields if they don't exist
          const loadedSplit = JSON.parse(storedSplit);
          setCyclicalWorkoutSplit(augmentWorkoutSplit(loadedSplit));
      } else {
          setCyclicalWorkoutSplit(initialWorkoutSplit);
      }

      const storedProteinIntakes = localStorage.getItem('gym_protein_intakes');
      if(storedProteinIntakes) setProteinIntakes(JSON.parse(storedProteinIntakes));
      
      const storedLoggedFoods = localStorage.getItem('gym_logged_foods');
      if(storedLoggedFoods) setLoggedFoodItems(JSON.parse(storedLoggedFoods));

      const storedProteinTarget = localStorage.getItem('gym_protein_target');
      if(storedProteinTarget) setProteinTarget(JSON.parse(storedProteinTarget));

      const storedCustomFoods = localStorage.getItem('gym_custom_foods');
      if(storedCustomFoods) setCustomFoodItems(JSON.parse(storedCustomFoods));

    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({ variant: 'destructive', title: "Error", description: "Could not load saved data." });
      setHabits(P_HABITS);
      setCyclicalWorkoutSplit(initialWorkoutSplit);
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
    localStorage.setItem('gym_protein_intakes', JSON.stringify(proteinIntakes));
    localStorage.setItem('gym_logged_foods', JSON.stringify(loggedFoodItems));
    localStorage.setItem('gym_protein_target', JSON.stringify(proteinTarget));
    localStorage.setItem('gym_custom_foods', JSON.stringify(customFoodItems));
  }, [habits, cycleConfig, cyclicalWorkoutSplit, proteinIntakes, loggedFoodItems, proteinTarget, customFoodItems, isLoading]);

  // --- Habit Syncing Logic ---
  useEffect(() => {
    if (isLoading) return;

    const todayKey = format(new Date(), 'yyyy-MM-dd');
    
    setHabits(currentHabits => {
        if (!currentHabits || currentHabits.length === 0) {
            return currentHabits;
        }

        let habitsChanged = false;

        const newHabits = currentHabits.map(habit => {
            if (!habit) return habit;
            let newCompletions = { ...habit.completions };
            let changedInThisHabit = false;

            if (habit.icon === 'Beef') {
                const todaysIntakes = proteinIntakes.filter(intake => format(parseISO(intake.timestamp), 'yyyy-MM-dd') === todayKey);
                const totalProtein = todaysIntakes.reduce((sum, intake) => sum + intake.amount, 0);
                const isCompleted = totalProtein >= proteinTarget;

                if (!!newCompletions[todayKey] !== isCompleted) {
                    if (isCompleted) newCompletions[todayKey] = true;
                    else delete newCompletions[todayKey];
                    changedInThisHabit = true;
                }
            }

            if (habit.icon === 'Pill') {
                const todaysLogs = loggedFoodItems.filter(i => format(parseISO(i.timestamp), 'yyyy-MM-dd') === todayKey);
                const todaysLoggedNames = new Set(todaysLogs.map(log => log.name));
                const isCompleted = customFoodItems.length > 0 && customFoodItems.every(item => todaysLoggedNames.has(item));

                if (!!newCompletions[todayKey] !== isCompleted) {
                    if (isCompleted) newCompletions[todayKey] = true;
                    else delete newCompletions[todayKey];
                    changedInThisHabit = true;
                }
            }

            if (changedInThisHabit) {
                habitsChanged = true;
                return { ...habit, completions: newCompletions };
            }
            return habit;
        });

        if (habitsChanged) {
            return newHabits;
        }
        return currentHabits;
    });

  }, [proteinIntakes, proteinTarget, loggedFoodItems, customFoodItems, isLoading]);


  // --- Handlers ---
  const handleUpdateHabit = (updatedHabit: Habit) => {
    setHabits(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const handleToggleCompletion = (habitId: string, date: string) => {
    setHabits(habits.map(h => {
        if (h.id === habitId && !SPECIAL_HABIT_ICONS.includes(h.icon)) {
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
  
    const handleDeleteHabit = () => {
        if (!habitToDelete) return;
        setHabits(prev => prev.filter(h => h.id !== habitToDelete.id));
        setHabitToDelete(null);
        toast({ title: "Habit Deleted", description: `"${habitToDelete.name}" has been removed.` });
    };

    const handleAddHabit = (name: string, icon: string) => {
        const newHabit: Habit = {
            id: `habit-${Date.now()}`,
            name: name,
            icon: icon,
            completions: {},
        };
        setHabits(prev => [...prev, newHabit]);
        toast({ title: "Habit Added!", description: `"${newHabit.name}" has been added to your Streak Book.` });
    };

  const getWorkoutDayInfo = useWorkoutDayInfo(cyclicalWorkoutSplit, cycleConfig);
  const todaysWorkoutInfo = useMemo(() => getWorkoutDayInfo(new Date()), [getWorkoutDayInfo, cyclicalWorkoutSplit, cycleConfig]);
  
  const workoutHabit = habits.find(h => h.icon === 'Dumbbell');
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
        <header>
          <h1 className="text-xl font-bold font-headline">Habit Tracker</h1>
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
            onManagePlan={() => setIsGymSettingsOpen(true)}
            onToggleWorkoutCompletion={handleToggleWorkoutCompletion}
            isTodayCompleted={isTodayWorkoutCompleted}
            todaysWorkoutInfo={todaysWorkoutInfo}
            onOpenOverloadTracker={() => setIsOverloadTrackerOpen(true)}
        />

        <Separator />

        <div className="space-y-4">
            <header className="flex items-center justify-between">
                <h2 className="text-xl font-bold font-headline flex items-center gap-2">
                    <BookOpenCheck className="h-6 w-6 text-primary" />
                    <span>Streak Book</span>
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsAddHabitDialogOpen(true)}>
                    <PlusCircle className="h-5 w-5" />
                </Button>
            </header>
            <Accordion type="single" collapsible className="w-full space-y-4">
                {habits.map((habit) => {
                    if (!habit) return null;
                    const Icon = iconMap[habit.icon] || iconMap.CheckCircle2;
                    const isWaterHabit = habit.icon === 'GlassWater';
                    const isSyncedHabit = SPECIAL_HABIT_ICONS.includes(habit.icon);
                    const streak = calculateStreak(
                        habit.completions,
                        isWaterHabit ? (habit.target || 8) : 1
                    );

                    return (
                        <Card key={habit.id} className="group">
                            <AccordionItem value={habit.id} className="border-b-0">
                                <AccordionTrigger className="p-4 hover:no-underline">
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-3">
                                            <Icon className="h-6 w-6 text-muted-foreground" />
                                            <span className="font-semibold text-base">{habit.name}</span>
                                            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div
                                                    role="button"
                                                    aria-label="Edit habit"
                                                    className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-accent cursor-pointer"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingHabit(habit);
                                                        setIsEditHabitDialogOpen(true);
                                                    }}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </div>
                                                {!isSyncedHabit && (
                                                    <div
                                                        role="button"
                                                        aria-label="Delete habit"
                                                        className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setHabitToDelete(habit);
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </div>
                                                )}
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
      <AddHabitDialog
        isOpen={isAddHabitDialogOpen}
        onOpenChange={setIsAddHabitDialogOpen}
        onSave={handleAddHabit}
       />
      <GymSettingsDialog
        isOpen={isGymSettingsOpen}
        onOpenChange={setIsGymSettingsOpen}
        workoutSplit={cyclicalWorkoutSplit}
        cycleConfig={cycleConfig}
        onSave={(newSplit, newConfig) => {
            setCyclicalWorkoutSplit(newSplit);
            setCycleConfig(newConfig);
            setIsGymSettingsOpen(false);
            toast({ title: 'Gym settings saved!' });
        }}
      />
       <FoodManagerDialog
        isOpen={isFoodManagerOpen}
        onOpenChange={setIsFoodManagerOpen}
        customItems={customFoodItems}
        onSave={(newItems) => {
          setCustomFoodItems(newItems);
          setIsFoodManagerOpen(false);
        }}
       />
       <OverloadTrackerDialog
         isOpen={isOverloadTrackerOpen}
         onOpenChange={setIsOverloadTrackerOpen}
         workoutSplit={cyclicalWorkoutSplit}
         setWorkoutSplit={setCyclicalWorkoutSplit}
       />
       <AlertDialog open={!!habitToDelete} onOpenChange={() => setHabitToDelete(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the "{habitToDelete?.name}" habit and all its data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setHabitToDelete(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteHabit}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
       </AlertDialog>
    </AppLayout>
  );
}

const availableIcons = [
  { name: 'CheckCircle2', label: 'Check Circle' },
  { name: 'Bed', label: 'Bed' },
  { name: 'Footprints', label: 'Activity' },
  { name: 'Sunrise', label: 'Sunrise' },
  { name: 'Guitar', label: 'Guitar' },
  { name: 'Code', label: 'Coding' },
  { name: 'Leaf', label: 'Nature' },
];

function AddHabitDialog({
  isOpen,
  onOpenChange,
  onSave,
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string, icon: string) => void;
}) {
    const { toast } = useToast();
    const [name, setName] = useState('');
    const [icon, setIcon] = useState(availableIcons[0].name);

    const handleSave = () => {
        if (!name.trim()) {
            toast({ title: 'Name is required', variant: 'destructive' });
            return;
        }
        onSave(name, icon);
        onOpenChange(false);
        setName('');
        setIcon(availableIcons[0].name);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setName('');
                setIcon(availableIcons[0].name);
            }
            onOpenChange(open);
        }}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create a New Habit</DialogTitle>
                    <DialogDescription>
                        Give your new habit a name and an icon to get started.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="new-habit-name">Habit Name</Label>
                        <Input
                            id="new-habit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Read for 15 minutes"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="new-habit-icon">Icon</Label>
                        <Select value={icon} onValueChange={setIcon}>
                            <SelectTrigger id="new-habit-icon">
                                <SelectValue placeholder="Select an icon" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableIcons.map(iconInfo => {
                                    const IconComponent = iconMap[iconInfo.name];
                                    if (!IconComponent) return null;
                                    return (
                                        <SelectItem key={iconInfo.name} value={iconInfo.name}>
                                            <div className="flex items-center gap-2">
                                                <IconComponent className="h-4 w-4" />
                                                <span>{iconInfo.label}</span>
                                            </div>
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Create Habit</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}



    
