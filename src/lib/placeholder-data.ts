import type { RoutineItem, TodoItem, Expense, Habit, Note } from '@/types';
import { subDays, formatISO } from 'date-fns';

export const P_ROUTINE_ITEMS: RoutineItem[] = [
  { id: '1', time: '06:00 AM', title: 'Wake up & Hydrate', description: 'Drink a full glass of water.' },
  { id: '2', time: '06:15 AM', title: 'Morning Mobility', description: '15 minutes of light stretching.' },
  { id: '3', time: '07:00 AM', title: 'Deep Work Session 1', description: 'Focus on the most important task.' },
  { id: '4', time: '09:00 AM', title: 'Breakfast & Break', description: 'Healthy meal and short walk.' },
  { id: '5', time: '12:00 PM', title: 'Lunch', description: 'Nutritious lunch away from the desk.' },
  { id: '6', time: '03:00 PM', title: 'Deep Work Session 2', description: 'Tackle the second priority task.' },
  { id: '7', time: '06:00 PM', title: 'Workout', description: 'Gym session or home workout.' },
];

export const P_TODO_ITEMS: TodoItem[] = [
  { id: '1', text: 'Finalize Q3 report presentation', completed: false },
  { id: '2', text: 'Book dentist appointment', completed: false },
  { id: '3', text: 'Buy groceries for the week', completed: true },
  { id: '4', text: 'Call mom', completed: false },
];

export const P_EXPENSES: Expense[] = [
  { id: '1', description: 'Morning Coffee', amount: 4.50, category: 'Food', date: formatISO(subDays(new Date(), 1)) },
  { id: '2', description: 'Monthly Gym Subscription', amount: 50.00, category: 'Health', date: formatISO(subDays(new Date(), 2)) },
  { id: '3', description: 'Gasoline for car', amount: 65.20, category: 'Transport', date: formatISO(subDays(new Date(), 2)) },
  { id: '4', description: 'Groceries from Whole Foods', amount: 124.80, category: 'Groceries', date: formatISO(subDays(new Date(), 3)) },
  { id: '5', description: 'New book: "The Atomic Habit"', amount: 22.00, category: 'Shopping', date: formatISO(subDays(new Date(), 5)) },
  { id: '6', description: 'Dinner with friends', amount: 78.50, category: 'Social', date: formatISO(subDays(new Date(), 6)) },
];

const generateHabitCompletions = (days: number, successRate: number): Record<string, boolean> => {
  const completions: Record<string, boolean> = {};
  for (let i = 0; i < days; i++) {
    const date = formatISO(subDays(new Date(), i), { representation: 'date' });
    if (Math.random() < successRate) {
      completions[date] = true;
    }
  }
  return completions;
};

export const P_HABITS: Habit[] = [
  { id: '1', name: 'Read 10 Pages', icon: 'BookOpen', completions: generateHabitCompletions(30, 0.8) },
  { id: '2', name: 'Meditate 10 mins', icon: 'BrainCircuit', completions: generateHabitCompletions(30, 0.6) },
  { id: '3', name: 'Workout', icon: 'Dumbbell', completions: generateHabitCompletions(30, 0.5) },
  { id: '4', name: 'Drink 2L Water', icon: 'GlassWater', completions: generateHabitCompletions(30, 0.9) },
];

export const P_NOTES: Note[] = [
    {
        id: '1',
        title: 'Project Phoenix Ideas',
        content: 'Initial thoughts on the new project architecture. Consider using a micro-frontend approach for scalability. Investigate Zustand for state management.',
        type: 'text',
        createdAt: formatISO(subDays(new Date(), 2)),
    },
    {
        id: '2',
        title: 'Weekly Shopping List',
        content: [
            { text: 'Avocado', completed: true },
            { text: 'Sourdough bread', completed: true },
            { text: 'Oat milk', completed: false },
            { text: 'Salmon fillets', completed: false },
            { text: 'Mixed greens', completed: true },
        ],
        type: 'checklist',
        createdAt: formatISO(subDays(new Date(), 1)),
    },
    {
        id: '3',
        title: 'Gift Ideas for Sarah',
        content: '- Leather-bound journal\n- Subscription to a coffee service\n- Tickets to the new play downtown\n- A nice fountain pen',
        type: 'text',
        createdAt: formatISO(subDays(new Date(), 5)),
    },
];
