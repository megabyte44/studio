
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { CalendarClock, Edit, PlusCircle, Trash, Loader2, Info } from 'lucide-react';
import type { PlannerItem } from '@/types';
import { ScrollArea } from '@/components/ui/scroll-area';

const LOCAL_STORAGE_KEY = 'lifeos_weeklySchedule';
const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const durationOptions = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "1 hour" },
    { value: "90", label: "1.5 hours" },
    { value: "120", label: "2 hours" },
    { value: "180", label: "3 hours" },
];

const getCurrentDayName = () => {
    const today = new Date();
    const dayIndex = today.getDay(); // Sunday: 0, Monday: 1, ...
    return daysOfWeek[dayIndex === 0 ? 6 : dayIndex - 1];
};

const calculateEndTime = (startTime: string, durationMinutes: number) => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    startDate.setMinutes(startDate.getMinutes() + durationMinutes);
    return `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')}`;
};

function TemplateDialog({ isOpen, onOpenChange, weeklySchedule, onScheduleUpdate }: {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    weeklySchedule: Record<string, PlannerItem[]>;
    onScheduleUpdate: (newSchedule: Record<string, PlannerItem[]>) => void;
}) {
    const { toast } = useToast();
    const [selectedTemplateDay, setSelectedTemplateDay] = useState(getCurrentDayName());

    const [title, setTitle] = useState('');
    const [startTime, setStartTime] = useState('09:00');
    const [duration, setDuration] = useState('60');
    const [tag, setTag] = useState('');

    const handleAddItemToTemplate = () => {
        if (!title.trim()) {
            toast({ title: "Missing Info", description: "Please provide a title.", variant: "destructive" });
            return;
        }

        const newItem: PlannerItem = {
            id: `${selectedTemplateDay.toLowerCase()}-${Date.now()}`,
            startTime,
            endTime: calculateEndTime(startTime, parseInt(duration)),
            title: title.trim(),
            tag: tag.trim() || undefined,
        };

        const newSchedule = { ...weeklySchedule };
        newSchedule[selectedTemplateDay] = [...(newSchedule[selectedTemplateDay] || []), newItem]
            .sort((a, b) => a.startTime.localeCompare(b.startTime));
        
        onScheduleUpdate(newSchedule);
        toast({ title: "Template Item Added", description: `"${title}" added to ${selectedTemplateDay}'s template.` });

        setTitle('');
        setStartTime('09:00');
        setDuration('60');
        setTag('');
    };

    const handleDeleteItemFromTemplate = (itemId: string) => {
        const newSchedule = { ...weeklySchedule };
        newSchedule[selectedTemplateDay] = (newSchedule[selectedTemplateDay] || []).filter(item => item.id !== itemId);
        onScheduleUpdate(newSchedule);
        toast({ title: "Item Deleted", variant: "destructive", description: "Item removed from template." });
    };
    
    const daySchedule = weeklySchedule[selectedTemplateDay] || [];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95%] sm:max-w-sm p-1.5">
                <DialogHeader className="p-1 pb-1">
                    <DialogTitle>Edit Daily Templates</DialogTitle>
                    <DialogDescription className="text-xs">Modify the base schedule for each day.</DialogDescription>
                </DialogHeader>
                <div className="space-y-1 py-0.5">
                    <div className="space-y-1">
                        <Label htmlFor="template-day-select" className="text-xs">Select Day</Label>
                        <Select value={selectedTemplateDay} onValueChange={setSelectedTemplateDay}>
                            <SelectTrigger id="template-day-select" className="h-8 text-xs">
                                <SelectValue placeholder="Select a day" />
                            </SelectTrigger>
                            <SelectContent>
                                {daysOfWeek.map(day => <SelectItem key={day} value={day} className="text-xs">{day}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>

                    <h4 className="font-semibold text-sm">Template for {selectedTemplateDay}</h4>
                    {daySchedule.length > 0 && (
                        <ScrollArea className="h-28 pr-2 border rounded-md">
                            <div className="space-y-1 p-1">
                                {daySchedule.map(item => (
                                    <div key={item.id} className="flex items-center justify-between p-1 rounded-md bg-muted/50 text-xs">
                                        <div>
                                            <span className="font-semibold">{item.startTime}-{item.endTime}</span>: {item.title}
                                            {item.tag && <span className="ml-1.5 text-xs bg-primary/20 text-primary-foreground px-1 py-0.5 rounded-full">{item.tag}</span>}
                                        </div>
                                        <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleDeleteItemFromTemplate(item.id)}>
                                            <Trash className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}

                    <div className="pt-1.5 mt-1.5 border-t space-y-1">
                         <h4 className="font-semibold text-sm">Add Item to Template</h4>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 gap-y-1">
                            <div className="sm:col-span-2 space-y-1">
                                <Label htmlFor="template-item-title" className="text-xs">Title</Label>
                                <Input id="template-item-title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Morning Commute" className="h-8 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="template-item-start-time" className="text-xs">Start Time</Label>
                                <Input id="template-item-start-time" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="h-8 text-xs" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="template-item-duration" className="text-xs">Duration</Label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger id="template-item-duration" className="h-8 text-xs"><SelectValue/></SelectTrigger>
                                    <SelectContent>{durationOptions.map(opt => <SelectItem key={opt.value} value={opt.value} className="text-xs">{opt.label}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                             <div className="sm:col-span-2 space-y-1">
                                <Label htmlFor="template-item-tag" className="text-xs">Tag</Label>
                                <Input id="template-item-tag" value={tag} onChange={e => setTag(e.target.value)} placeholder="e.g., Routine, Errand" className="h-8 text-xs" />
                            </div>
                         </div>
                    </div>
                </div>
                <DialogFooter className="pt-1.5 flex-row justify-end gap-x-2">
                    <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button size="sm" onClick={handleAddItemToTemplate}>Add to Template</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function PlannerPage() {
    const { toast } = useToast();
    const [weeklySchedule, setWeeklySchedule] = useState<Record<string, PlannerItem[]>>({});
    const [selectedDay, setSelectedDay] = useState(getCurrentDayName());
    const [isLoading, setIsLoading] = useState(true);
    const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

    // Form state for ad-hoc items
    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemStartTime, setNewItemStartTime] = useState('09:00');
    const [newItemDuration, setNewItemDuration] = useState('60');
    const [newItemTag, setNewItemTag] = useState('');
    const [newItemAddToAllWeek, setNewItemAddToAllWeek] = useState(false);

    useEffect(() => {
        try {
            const storedSchedule = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (storedSchedule) {
                setWeeklySchedule(JSON.parse(storedSchedule));
            } else {
                const initialSchedule: Record<string, PlannerItem[]> = {};
                daysOfWeek.forEach(day => { initialSchedule[day] = [] });
                setWeeklySchedule(initialSchedule);
            }
        } catch (error) {
            console.error("Failed to load schedule from localStorage", error);
            toast({ title: "Error", description: "Could not load schedule.", variant: "destructive" });
        }
        setIsLoading(false);
    }, [toast]);
    
    useEffect(() => {
        if (!isLoading) {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(weeklySchedule));
        }
    }, [weeklySchedule, isLoading]);
    
    const handleAddAdhocItem = () => {
        if (!newItemTitle.trim()) {
            toast({ title: "Missing Info", description: "Please provide a title for the item.", variant: "destructive" });
            return;
        }

        const daysToUpdate = newItemAddToAllWeek ? daysOfWeek : [selectedDay];
        const newSchedule = { ...weeklySchedule };

        daysToUpdate.forEach(day => {
            const newItem: PlannerItem = {
                id: `${day.toLowerCase()}-${Date.now()}`,
                startTime: newItemStartTime,
                endTime: calculateEndTime(newItemStartTime, parseInt(newItemDuration)),
                title: newItemTitle.trim(),
                tag: newItemTag.trim() || undefined,
            };
            newSchedule[day] = [...(newSchedule[day] || []), newItem].sort((a, b) => a.startTime.localeCompare(b.startTime));
        });

        setWeeklySchedule(newSchedule);
        
        toast({ title: "Item Added", description: `"${newItemTitle}" was added to ${newItemAddToAllWeek ? 'all days this week' : selectedDay}.`});
        
        setNewItemTitle('');
        setNewItemStartTime('09:00');
        setNewItemDuration('60');
        setNewItemTag('');
        setNewItemAddToAllWeek(false);
    };

    const handleDeleteAdhocItem = (day: string, itemId: string) => {
        const newSchedule = { ...weeklySchedule };
        newSchedule[day] = (newSchedule[day] || []).filter(item => item.id !== itemId);
        setWeeklySchedule(newSchedule);
        toast({ title: "Item Deleted", variant: "destructive", description: "Item removed from schedule." });
    };

    const daySchedule = weeklySchedule[selectedDay] || [];

    if (isLoading) {
        return (
            <AppLayout>
                <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="ml-2">Loading schedule...</p>
                </div>
            </AppLayout>
        )
    }

    return (
        <AppLayout>
            <TooltipProvider>
                <div className="max-w-4xl mx-auto space-y-6">
                    <header className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mx-auto">
                           <CalendarClock className="h-8 w-8" />
                        </div>
                        <h1 className="text-3xl font-bold font-headline">Daily Planner</h1>
                        <p className="text-lg text-muted-foreground">Manage your schedule, tasks, and time effectively.</p>
                    </header>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Schedule for {selectedDay}</CardTitle>
                            <Button variant="outline" onClick={() => setIsTemplateDialogOpen(true)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit Daily Templates
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="day-select">Select a day to view/add to:</Label>
                                    <Select value={selectedDay} onValueChange={setSelectedDay}>
                                        <SelectTrigger id="day-select">
                                            <SelectValue placeholder="Select a day" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {daysOfWeek.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <ScrollArea className="h-72 pr-4 border rounded-md p-2">
                                    {daySchedule.length > 0 ? (
                                        <div className="space-y-2">
                                            {daySchedule.map(item => (
                                                <div key={item.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50 text-sm">
                                                    <div>
                                                        <span className="font-semibold">{item.startTime} - {item.endTime}</span>: {item.title}
                                                        {item.tag && <span className="ml-2 text-xs bg-primary/20 text-primary-foreground px-1.5 py-0.5 rounded-full">{item.tag}</span>}
                                                    </div>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteAdhocItem(selectedDay, item.id)}>
                                                        <Trash className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-center h-full">
                                            <p className="text-muted-foreground">No items scheduled for {selectedDay}.</p>
                                        </div>
                                    )}
                                </ScrollArea>

                                <div className="pt-4 border-t">
                                    <h3 className="font-semibold text-lg mb-4">Add Ad-hoc Item to {selectedDay}</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label htmlFor="new-item-title">Title</Label>
                                            <Input id="new-item-title" value={newItemTitle} onChange={e => setNewItemTitle(e.target.value)} placeholder="e.g., Study Session, Meeting" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-item-start-time">Start Time</Label>
                                            <Input id="new-item-start-time" type="time" value={newItemStartTime} onChange={e => setNewItemStartTime(e.target.value)} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="new-item-duration">Duration</Label>
                                            <Select value={newItemDuration} onValueChange={setNewItemDuration}>
                                                <SelectTrigger id="new-item-duration"><SelectValue /></SelectTrigger>
                                                <SelectContent>{durationOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                        <div className="sm:col-span-2 space-y-2">
                                            <Label htmlFor="new-item-tag">Tag (Optional)</Label>
                                            <Input id="new-item-tag" value={newItemTag} onChange={e => setNewItemTag(e.target.value)} placeholder="e.g., Work, Personal, College" />
                                        </div>
                                        <div className="sm:col-span-2 flex items-center space-x-2">
                                            <Checkbox id="new-item-add-to-all-week" checked={newItemAddToAllWeek} onCheckedChange={(checked) => setNewItemAddToAllWeek(!!checked)} />
                                            <Label htmlFor="new-item-add-to-all-week" className="flex items-center gap-1.5">
                                                Add to all days this week
                                                <Tooltip delayDuration={0}>
                                                    <TooltipTrigger asChild>
                                                        <Info className="h-4 w-4 text-muted-foreground" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Adds the item to Mon-Sun of the current week.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </Label>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <Button onClick={handleAddAdhocItem} className="w-full sm:w-auto">
                                                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <TemplateDialog 
                    isOpen={isTemplateDialogOpen} 
                    onOpenChange={setIsTemplateDialogOpen} 
                    weeklySchedule={weeklySchedule}
                    onScheduleUpdate={setWeeklySchedule}
                />
            </TooltipProvider>
        </AppLayout>
    );
}
