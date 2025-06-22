
import type { RoutineItem, TodoItem, Transaction, Habit, Note } from '@/types';
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
  { id: '1', text: 'Finalize Q3 report presentation', completed: false, priority: 'high' },
  { id: '2', text: 'Book dentist appointment', completed: false, priority: 'medium' },
  { id: '3', text: 'Buy groceries for the week', completed: true, priority: 'low' },
  { id: '4', text: 'Call mom', completed: false, priority: 'low' },
];

export const P_TRANSACTIONS: Transaction[] = [
  { id: '1', description: 'Salary', amount: 5000000, category: 'Income', date: formatISO(subDays(new Date(), 15)), type: 'income' },
  { id: '2', description: 'Monthly Gym Subscription', amount: 150000, category: 'Health', date: formatISO(subDays(new Date(), 2)), type: 'expense' },
  { id: '3', description: 'Flight to Goa', amount: 200000, category: 'Travel', date: formatISO(subDays(new Date(), 2)), type: 'expense' },
  { id: '4', description: 'Groceries from BigBasket', amount: 450000, category: 'Groceries', date: formatISO(subDays(new Date(), 3)), type: 'expense' },
  { id: '5', description: 'New T-Shirt', amount: 50000, category: 'Clothing', date: formatISO(subDays(new Date(), 5)), type: 'expense' },
  { id: '6', description: 'Dinner with friends', amount: 250000, category: 'Food', date: formatISO(subDays(new Date(), 6)), type: 'expense' },
  { id: '7', description: 'Morning Coffee', amount: 15000, category: 'Food', date: formatISO(new Date()), type: 'expense' },
  { id: '8', description: 'Movie Tickets', amount: 36000, category: 'Entertainment', date: formatISO(new Date()), type: 'expense' },
  { id: '9', description: 'Uber ride', amount: 2000, category: 'Travel', date: formatISO(new Date()), type: 'expense' },
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

const generateWaterCompletions = (days: number, successRate: number, maxGlasses: number): Record<string, number> => {
  const completions: Record<string, number> = {};
  for (let i = 0; i < days; i++) {
    const date = formatISO(subDays(new Date(), i), { representation: 'date' });
    if (Math.random() < successRate) {
      completions[date] = Math.floor(Math.random() * maxGlasses) + 1;
    }
  }
  return completions;
};


export const P_HABITS: Habit[] = [
  { id: '1', name: 'Read 10 Pages', icon: 'BookOpen', completions: generateHabitCompletions(30, 0.8) },
  { id: '2', name: 'Meditate 10 mins', icon: 'BrainCircuit', completions: generateHabitCompletions(30, 0.6) },
  { id: '3', name: 'Workout', icon: 'Dumbbell', completions: generateHabitCompletions(30, 0.5) },
  { id: '4', name: 'Drink 2L Water', icon: 'GlassWater', completions: generateWaterCompletions(30, 0.9, 10) },
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
