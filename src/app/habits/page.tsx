
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Habit, Exercise, WorkoutDay, CyclicalWorkoutSplit, CycleConfig, ProteinIntake, LoggedFoodItem, CompletedWorkouts } from '@/types';
import { P_HABITS } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
    PlusCircle, Flame, List, Dumbbell, CalendarDays, Edit, Beef, Apple, Settings, Trash2, Check, 
    AlertTriangle, Droplets, Plus, Minus, BookOpenCheck, Pill, Bed, Footprints, 
    Sunrise, Guitar, Code, Leaf, CheckCircle2, GlassWater, CalendarIcon 
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

const iconMap: Record<string, React.ElementType> = {
    PlusCircle, Flame, List, Dumbbell, CalendarDays, Edit, Beef, Apple, Settings, Trash2, Check, 
    AlertTriangle, Droplets, Plus, Minus, BookOpenCheck, Pill, Bed, Footprints, 
    Sunrise, Guitar, Code, Leaf, CheckCircle2, GlassWater
};

// --- Initial Data for Gym Tracker ---
const initialWorkoutSplit: CyclicalWorkoutSplit = {
  "Day 1": { title: "Push Day (Chest, Shoulders, Triceps)", exercises: [{ name: "Bench Press", sets: "3-4", reps: "8-12" }, { name: "Overhead Press", sets: "3", reps: "8-12" }, { name: "Incline Dumbbell Press", sets: "3", reps: "10-15" }, { name: "Tricep Dips/Pushdowns", sets: "3", reps: "10-15" }, { name: "Lateral Raises", sets: "3", reps: "12-15" }] },
  "Day 2": { title: "Pull Day (Back, Biceps)", exercises: [{ name: "Pull-ups/Lat Pulldowns", sets: "3-4", reps: "6-12" }, { name: "Bent-over Rows", sets: "3", reps: "8-12" }, { name: "Seated Cable Rows", sets: "3", reps: "10-15" }, { name: "Barbell Curls", sets: "3", reps: "8-12" }, { name: "Face Pulls", sets: "3", reps: "15-20" }] },
  "Day 3": { title: "Leg Day (Quads, Hamstrings, Calves)", exercises: [{ name: "Squats", sets: "3-4", reps: "8-12" }, { name: "Romanian Deadlifts", sets: "3", reps: "10-12" }, { name: "Leg Press", sets: "3", reps: "10-15" }, { name: "Leg Curls", sets: "3", reps: "10-15" }, { name: "Calf Raises", sets: "3", reps: "15-20" }] },
  "Day 4 (Rest)": { title: "Rest or Active Recovery", exercises: [] },
};
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
};


function GymTracker({ 
    habits, setHabits, 
    proteinIntakes, setProteinIntakes, 
    loggedFoodItems, setLoggedFoodItems,
    proteinTarget, setProteinTarget,
    customFoodItems, setCustomFoodItems,
    onManageCustomFoodItems,
    cyclicalWorkoutSplit, cycleConfig,
    onToggleWorkoutCompletion,
    isTodayCompleted,
    todaysWorkoutInfo,
    onManagePlan,
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
                 {/* Workout Plan Card */}
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
  const currentTargetInGlasses = habit.target || 8; // Default to 8 glasses

  const handleTargetChange = (increment: number) => {
    const newTarget = Math.max(1, currentTargetInGlasses + increment); // Minimum 1 glass
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


function GymSettingsDialog({ 
    isOpen, 
    onOpenChange, 
    workoutSplit, 
    cycleConfig, 
    onSave 
}: {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    workoutSplit: CyclicalWorkoutSplit;
    cycleConfig: CycleConfig;
    onSave: (newSplit: CyclicalWorkoutSplit, newConfig: CycleConfig) => void;
}) {
    const [editedSplit, setEditedSplit] = useState<CyclicalWorkoutSplit>({});
    const [editedConfig, setEditedConfig] = useState<CycleConfig>({ startDate: '', startDayKey: '' });

    useEffect(() => {
        if (isOpen) {
            setEditedSplit(JSON.parse(JSON.stringify(workoutSplit)));
            setEditedConfig(JSON.parse(JSON.stringify(cycleConfig)));
        }
    }, [isOpen, workoutSplit, cycleConfig]);
    
    const handleDayTitleChange = (dayKey: string, newTitle: string) => {
        setEditedSplit(prev => ({ ...prev, [dayKey]: { ...prev[dayKey], title: newTitle }}));
    };

    const handleExerciseChange = (dayKey: string, exIndex: number, field: keyof Exercise, value: string) => {
        setEditedSplit(prev => {
            const newSplit = { ...prev };
            newSplit[dayKey].exercises[exIndex] = { ...newSplit[dayKey].exercises[exIndex], [field]: value };
            return newSplit;
        });
    };

    const handleAddExercise = (dayKey: string) => {
        setEditedSplit(prev => {
            const newSplit = { ...prev };
            newSplit[dayKey].exercises.push({ name: 'New Exercise', sets: '3', reps: '10' });
            return newSplit;
        });
    };
    
    const handleDeleteExercise = (dayKey: string, exIndex: number) => {
        setEditedSplit(prev => {
            const newSplit = { ...prev };
            newSplit[dayKey].exercises.splice(exIndex, 1);
            return newSplit;
        });
    };
    
    const handleAddDay = () => {
        setEditedSplit(prev => {
            const newDayKey = `Day ${Object.keys(prev).length + 1}`;
            return { ...prev, [newDayKey]: { title: 'New Workout Day', exercises: [] }};
        });
    };
    
    const handleDeleteDay = (dayKey: string) => {
        setEditedSplit(prev => {
            const newSplit = { ...prev };
            delete newSplit[dayKey];
            return newSplit;
        });
    };
    
    const handleSaveChanges = () => {
        onSave(editedSplit, editedConfig);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] max-w-lg rounded-lg p-1">
                <DialogHeader className="p-1 pb-0">
                    <DialogTitle className="text-base">Manage Gym Plan</DialogTitle>
                    <DialogDescription className="text-xs">
                        Edit your workout plan and cycle configuration.
                    </DialogDescription>
                </DialogHeader>

                <div className="p-1">
                    <ScrollArea className="max-h-[60vh] pr-2 -mr-2">
                        <Tabs defaultValue="plan" className="w-full">
                            <TabsList className="h-8">
                                <TabsTrigger value="plan" className="text-xs px-2 py-1">Workout Plan</TabsTrigger>
                                <TabsTrigger value="cycle" className="text-xs px-2 py-1">Cycle Configuration</TabsTrigger>
                            </TabsList>
                            <TabsContent value="plan" className="mt-2">
                                    <Accordion type="multiple" className="w-full space-y-1">
                                        {Object.entries(editedSplit).map(([dayKey, dayData]) => (
                                            <AccordionItem value={dayKey} key={dayKey} className="border rounded-md px-2">
                                                <AccordionTrigger className="py-1.5 hover:no-underline">
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-xs font-medium">{dayKey}: {dayData.title}</span>
                                                        <Button variant="ghost" size="icon" className="mr-2 h-6 w-6" onClick={(e) => { e.stopPropagation(); handleDeleteDay(dayKey); }}>
                                                            <Trash2 className="h-3 w-3 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="space-y-2 pb-2">
                                                    <div>
                                                        <Label htmlFor={`title-${dayKey}`} className="text-xs">Day Title</Label>
                                                        <Input id={`title-${dayKey}`} value={dayData.title} onChange={(e) => handleDayTitleChange(dayKey, e.target.value)} className="h-7 text-xs" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <h4 className="font-medium text-xs">Exercises</h4>
                                                        {dayData.exercises.map((ex, exIndex) => (
                                                            <div key={exIndex} className="flex items-center gap-1">
                                                                <Input placeholder="Name" value={ex.name} onChange={(e) => handleExerciseChange(dayKey, exIndex, 'name', e.target.value)} className="flex-grow h-7 text-xs"/>
                                                                <Input placeholder="Sets" value={ex.sets} onChange={(e) => handleExerciseChange(dayKey, exIndex, 'sets', e.target.value)} className="w-14 h-7 text-xs"/>
                                                                <Input placeholder="Reps" value={ex.reps} onChange={(e) => handleExerciseChange(dayKey, exIndex, 'reps', e.target.value)} className="w-14 h-7 text-xs"/>
                                                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteExercise(dayKey, exIndex)}>
                                                                    <Trash2 className="h-3 w-3 text-destructive"/>
                                                                </Button>
                                                            </div>
                                                        ))}
                                                        <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleAddExercise(dayKey)}>Add Exercise</Button>
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                    <Button variant="secondary" size="sm" className="mt-2 h-7 px-2 text-xs" onClick={handleAddDay}>Add Workout Day</Button>
                            </TabsContent>
                            <TabsContent value="cycle" className="mt-2">
                                 <div className="space-y-2">
                                    <div>
                                        <Label className="text-xs">Cycle Start Date</Label>
                                        <p className="text-xs text-muted-foreground">Select the date your cycle begins.</p>
                                        <Calendar
                                            mode="single"
                                            selected={editedConfig.startDate ? parseISO(editedConfig.startDate) : new Date()}
                                            onSelect={(date) => date && setEditedConfig(prev => ({...prev, startDate: format(date, 'yyyy-MM-dd')}))}
                                            className="rounded-md border p-0"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-xs">Starting Day of Cycle</Label>
                                        <p className="text-xs text-muted-foreground">Select which workout corresponds to the start date.</p>
                                        <Select value={editedConfig.startDayKey} onValueChange={(value) => setEditedConfig(prev => ({...prev, startDayKey: value}))}>
                                            <SelectTrigger className="h-7 text-xs">
                                                <SelectValue placeholder="Select a day" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.keys(editedSplit).map(dayKey => (
                                                    <SelectItem key={dayKey} value={dayKey} className="text-xs">{dayKey}: {editedSplit[dayKey].title}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </ScrollArea>
                </div>
                <DialogFooter className="p-1 pt-0">
                    <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button size="sm" className="h-7 px-2 text-xs" onClick={handleSaveChanges}>Save Changes</Button>
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
      
      // Ensure all special habits from placeholder data are present
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
      if(storedSplit) setCyclicalWorkoutSplit(JSON.parse(storedSplit));

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

            // Sync Protein Streak
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

            // Sync Supplement Streak
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
  const todaysWorkoutInfo = useMemo(() => getWorkoutDayInfo(new Date()), [getWorkoutDayInfo]);
  
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
        <header className="flex items-center justify-between">
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

    

    

