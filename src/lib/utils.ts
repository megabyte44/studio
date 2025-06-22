import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { subDays, format } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const calculateStreak = (completions: Record<string, boolean>): number => {
    let streak = 0;
    let today = new Date();
    
    // The streak is continuous up to yesterday or today.
    // If today is not completed, the streak is counted up to yesterday.
    if (!completions[format(today, 'yyyy-MM-dd')]) {
        today = subDays(today, 1);
    }
    
    // Now, from `today` (which could be the actual today or yesterday), count backwards.
    for (let i = 0; i < 365 * 5; i++) { // Check for up to 5 years for long streaks
        const dayToCheck = subDays(today, i);
        if (completions[format(dayToCheck, 'yyyy-MM-dd')]) {
            streak++;
        } else {
            // As soon as we find a day that is not completed, the streak is broken.
            break;
        }
    }
    
    return streak;
};
