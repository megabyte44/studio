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
  priority?: 'high' | 'medium' | 'low';
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

// New types for Gym Tracker
export type Exercise = {
  name: string;
  sets: string;
  reps: string;
};

export type WorkoutDay = {
  title: string;
  exercises: Exercise[];
};

export type CyclicalWorkoutSplit = Record<string, WorkoutDay>;

export type CycleConfig = {
  startDate: string; // ISO Date string
  startDayKey: string;
};

export type ProteinIntake = {
  id: string;
  amount: number;
  timestamp: string; // ISO string
};

export type LoggedFoodItem = {
    id:string;
    name: string;
    timestamp: string; // ISO string
};

export type CompletedWorkouts = Record<string, boolean>; // date key: 'yyyy-MM-dd'
