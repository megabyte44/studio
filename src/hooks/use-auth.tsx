
'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { P_HABITS, P_NOTES, P_NOTIFICATIONS, P_PASSWORDS, P_TODO_ITEMS, P_TRANSACTIONS } from '@/lib/placeholder-data';
import type { Habit, Note, Notification, Credential, TodoItem, Transaction, PlannerItem } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export const useAuth = () => useContext(AuthContext);

const initializeNewUserData = async (userId: string) => {
    const defaultData: { [key: string]: any } = {
        todos: P_TODO_ITEMS,
        transactions: P_TRANSACTIONS,
        habits: P_HABITS,
        notes: P_NOTES,
        passwords: P_PASSWORDS,
        notifications: P_NOTIFICATIONS,
        budget: 5000000,
        settings: { gymTracking: true },
        weeklySchedule: {},
        ai_chats: [],
    };
    
    for (const [key, data] of Object.entries(defaultData)) {
        await setDoc(doc(db, 'users', userId, 'data', key), { items: data });
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
          // Create user profile document
          await setDoc(userDocRef, {
            email: firebaseUser.email,
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
            createdAt: new Date().toISOString(),
          });
          // Initialize all their data collections
          await initializeNewUserData(firebaseUser.uid);
        }
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const value = { user, loading };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
         <main className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p>Loading session...</p>
            </div>
         </main>
      ) : children}
    </AuthContext.Provider>
  );
};
