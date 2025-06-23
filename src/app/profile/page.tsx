
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Save } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const avatarSeeds = ["Felix", "Mimi", "Leo", "Cleo", "Max"];

export default function ProfilePage() {
  const { toast } = useToast();
  const [user, setUser] = useState<{ username: string; dob?: string; avatarSeed?: string } | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [dobInput, setDobInput] = useState<Date | undefined>();
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setUsernameInput(parsedUser.username || '');
      setSelectedAvatarSeed(parsedUser.avatarSeed || parsedUser.username);
      if (parsedUser.dob) {
        setDobInput(parseISO(parsedUser.dob));
      }
    }
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    if (!usernameInput.trim()) {
      toast({
        variant: 'destructive',
        title: 'Validation Error',
        description: 'Username cannot be empty.',
      });
      return;
    }

    const updatedUser = {
      username: usernameInput,
      dob: dobInput ? dobInput.toISOString() : user?.dob,
      avatarSeed: selectedAvatarSeed,
    };

    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    toast({
      title: 'Profile Updated',
      description: 'Your changes have been saved successfully.',
    });
    
    // Force a reload of the window to reflect changes in the layout (e.g., avatar)
    window.location.reload();
  };
  
  if (isLoading) {
    return (
        <AppLayout>
            <div className="space-y-4">
                <header>
                  <h1 className="text-2xl font-bold font-headline">Edit Profile</h1>
                  <p className="text-muted-foreground">Manage your profile settings here.</p>
                </header>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center gap-4">
                           <Skeleton className="h-20 w-20 rounded-full" />
                           <div className="space-y-2">
                             <Skeleton className="h-4 w-48" />
                             <Skeleton className="h-4 w-32" />
                           </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-1/6 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-1/6 mb-2" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Skeleton className="h-10 w-24" />
                    </CardFooter>
                </Card>
            </div>
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-4">
        <header>
          <h1 className="text-2xl font-bold font-headline">Edit Profile</h1>
          <p className="text-muted-foreground">Manage your profile settings here.</p>
        </header>
        <Card>
            <CardHeader>
                <CardTitle>Your Information</CardTitle>
                <CardDescription>Update your username and date of birth.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label>Choose Your Avatar</Label>
                    <div className="flex flex-wrap items-center gap-4">
                        {avatarSeeds.map((seed) => (
                            <button
                                key={seed}
                                type="button"
                                className={cn(
                                    'rounded-full ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                                    selectedAvatarSeed === seed && 'ring-2 ring-primary'
                                )}
                                onClick={() => setSelectedAvatarSeed(seed)}
                            >
                                <Avatar className="h-16 w-16">
                                    <AvatarImage src={`https://api.dicebear.com/8.x/lorelei/svg?seed=${seed}`} alt={seed} />
                                    <AvatarFallback>{seed.charAt(0)}</AvatarFallback>
                                </Avatar>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="dob">Date of Birth</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            id="dob"
                            variant={'outline'}
                            className={cn(
                            'w-full justify-start text-left font-normal',
                            !dobInput && 'text-muted-foreground'
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {dobInput ? format(dobInput, 'PPP') : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={dobInput}
                            onSelect={setDobInput}
                            initialFocus
                             disabled={(date) =>
                                date > new Date() || date < new Date('1900-01-01')
                            }
                        />
                        </PopoverContent>
                    </Popover>
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
            </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
}
