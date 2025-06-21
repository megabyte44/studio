'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Habit } from '@/types';
import { P_HABITS } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Flame } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { subDays, format, isSameDay, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const calculateStreak = (completions: Record<string, boolean>): number => {
    let streak = 0;
    let today = new Date();
    if (completions[format(today, 'yyyy-MM-dd')]) {
        streak++;
    } else if (completions[format(subDays(today, 1), 'yyyy-MM-dd')]) {
        today = subDays(today, 1);
        streak++;
    } else {
        return 0;
    }

    for (let i = 1; i < 365; i++) {
        const prevDay = subDays(today, i);
        if (completions[format(prevDay, 'yyyy-MM-dd')]) {
            streak++;
        } else {
            break;
        }
    }
    return streak;
};

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
                    const isCompleted = habit.completions[dateString];
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
  const [habits, setHabits] = useState<Habit[]>(P_HABITS);

  const handleToggleCompletion = (habitId: string, date: string) => {
    setHabits(habits.map(h => {
        if (h.id === habitId) {
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

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold font-headline">Habit Tracker</h1>
            <p className="text-muted-foreground">Cultivate good habits, one day at a time.</p>
          </div>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Habit
          </Button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {habits.map((habit) => (
            <HabitGrid key={habit.id} habit={habit} onToggle={handleToggleCompletion} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
