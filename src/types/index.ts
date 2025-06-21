export type RoutineItem = {
  id: string;
  time: string;
  title: string;
  description: string;
};

export type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
};

export type Habit = {
  id: string;
  name: string;
  icon: string;
  completions: Record<string, boolean>; // e.g. { '2024-07-21': true }
};

export type Note = {
  id: string;
  title: string;
  content: string | { text: string; completed: boolean }[];
  type: 'text' | 'checklist';
  createdAt: string;
};
