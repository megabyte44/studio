

export type PlannerItem = {
  id:string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  title: string;
  tag?: string;
};

export type TodoItem = {
  id:string;
  text: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
};

export type Transaction = {
  id: string;
  date: string; // ISO string 'yyyy-MM-dd'
  description: string;
  category: string;
  amount: number; // Stored in cents to avoid floating point issues
  type: 'income' | 'expense';
};

export type Habit = {
  id: string;
  name: string;
  icon: string;
  target?: number;
  completions: Record<string, boolean | number>; // e.g. { '2024-07-21': true, '2024-07-22': 4 }
};

export type Note = {
  id: string;
  title: string;
  content: string | { text: string; completed: boolean }[];
  type: 'text' | 'checklist';
  createdAt: string;
};

export type Credential = {
  id: string;
  name: string;
  category: 'Website' | 'Banking' | 'Social Media' | 'Other';
  lastUpdated: string;
  // Generic fields
  username?: string;
  password?: string;
  website?: string;
  // Banking fields
  accountNumber?: string;
  ifscCode?: string;
  upiPin?: string;
  netbankingId?: string;
  mpin?: string;
  netbankingPassword?: string;
  transactionPassword?: string;
};


// New types for Gym Tracker
export type ExerciseSession = {
  weight: number;
  reps: number;
  // Calculated fields for internal use
  score?: number;
  scoreDelta?: number;
};

export type Exercise = {
  id: string;
  name: string;
  sets: string;
  // For progressive overload tracker
  kValue?: number;
  baselineWeight?: number;
  baselineReps?: number;
  targetWeight?: number;
  targetReps?: number;
  sessionHistory?: ExerciseSession[];
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

export type Notification = {
  id: string;
  title: string;
  date: string; // ISO string 'yyyy-MM-dd'
  message: string;
  read: boolean;
};
