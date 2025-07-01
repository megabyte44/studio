
import type { TodoItem, Transaction, Habit, Note, Credential, Notification } from '@/types';
import { formatISO } from 'date-fns';

export const P_TODO_ITEMS: TodoItem[] = [];

export const P_TRANSACTIONS: Transaction[] = [];

export const P_HABITS: Habit[] = [
  { id: '3', name: 'Workout', icon: 'Dumbbell', completions: {} },
  { id: '4', name: 'Water Drinking', icon: 'GlassWater', target: 8, completions: {} },
  { id: '5', name: 'Food & Supplement Log', icon: 'Pill', completions: {} },
  { id: '6', name: 'Protein Intake', icon: 'Beef', completions: {} },
];

export const P_NOTES: Note[] = [];

export const P_PASSWORDS: Credential[] = [];

export const P_NOTIFICATIONS: Notification[] = [];
