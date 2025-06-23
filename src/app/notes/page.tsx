
'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Note } from '@/types';
import { P_NOTES } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, LayoutGrid, List, Trash2, X, Save, Edit } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, formatISO, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


const LOCAL_STORAGE_KEY_NOTES = 'lifeos_notes';

type Layout = 'grid' | 'list';

function ViewNoteDialog({ note, isOpen, onOpenChange }: { note: Note | null, isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    if (!note) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-headline">{note.title}</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-6">
                    <div className="py-4 text-base leading-relaxed">
                        {note.type === 'text' && (
                            <p className="whitespace-pre-wrap">{String(note.content)}</p>
                        )}
                        {note.type === 'checklist' && Array.isArray(note.content) && (
                            <ul className="space-y-3">
                                {note.content.map((item, index) => (
                                    <li key={index} className="flex items-start gap-3">
                                        <Checkbox checked={item.completed} disabled className="mt-1" />
                                        <span className={cn("flex-1", item.completed && 'line-through text-muted-foreground')}>
                                            {item.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function NewNoteCard({ onSave, onCancel }: { onSave: (note: Omit<Note, 'id' | 'createdAt'>) => void; onCancel: () => void; }) {
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'text' | 'checklist'>('text');
  const [textContent, setTextContent] = useState('');
  const [checklistItems, setChecklistItems] = useState<{ text: string; completed: boolean }[]>([{ text: '', completed: false }]);

  const handleAddItem = () => {
    setChecklistItems([...checklistItems, { text: '', completed: false }]);
  };

  const handleItemChange = (index: number, newText: string) => {
    const newItems = [...checklistItems];
    newItems[index].text = newText;
    setChecklistItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (checklistItems.length > 1) {
      const newItems = checklistItems.filter((_, i) => i !== index);
      setChecklistItems(newItems);
    }
  };

  const handleSaveClick = () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const content = type === 'text' 
      ? textContent 
      : checklistItems.filter(item => item.text.trim() !== '');

    if ((type === 'text' && (content as string).trim() === '') || (type === 'checklist' && (content as any[]).length === 0)) {
        toast({ title: "Note content cannot be empty", variant: "destructive" });
        return;
    }
    onSave({ title, content, type });
  };

  return (
    <Card className="flex flex-col h-full border-primary border-2 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center gap-2">
            <Input 
              placeholder="Note Title..." 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="text-lg font-headline font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto" 
            />
            <Button variant="ghost" size="icon" onClick={onCancel} className="h-8 w-8"><X className="h-4 w-4" /></Button>
        </div>
        <Select value={type} onValueChange={(v) => setType(v as 'text' | 'checklist')}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Note Type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="text">Text Note</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {type === 'text' ? (
          <Textarea
            placeholder="Type your note here..."
            className="flex-grow resize-none border-0 focus-visible:ring-0 p-0"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        ) : (
          <ScrollArea className="flex-grow h-48 pr-4">
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox disabled />
                  <Input
                    value={item.text}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder={`List item ${index + 1}`}
                    className="h-8"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" onClick={() => handleRemoveItem(index)} disabled={checklistItems.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleSaveClick} className="w-full"><Save className="mr-2 h-4 w-4"/>Save Note</Button>
      </CardFooter>
    </Card>
  );
}

function EditNoteCard({
  note,
  onSave,
  onCancel,
  onDelete,
}: {
  note: Note;
  onSave: (note: Note) => void;
  onCancel: () => void;
  onDelete: (noteId: string) => void;
}) {
  const { toast } = useToast();
  const [title, setTitle] = useState(note.title);
  const [type, setType] = useState(note.type);
  const [textContent, setTextContent] = useState(typeof note.content === 'string' ? note.content : '');
  const [checklistItems, setChecklistItems] = useState(Array.isArray(note.content) ? [...note.content] : [{ text: '', completed: false }]);

  const handleAddItem = () => {
    setChecklistItems([...checklistItems, { text: '', completed: false }]);
  };

  const handleItemTextChange = (index: number, newText: string) => {
    const newItems = [...checklistItems];
    newItems[index].text = newText;
    setChecklistItems(newItems);
  };
  
  const handleItemCompletionChange = (index: number, isChecked: boolean) => {
    const newItems = [...checklistItems];
    newItems[index].completed = isChecked;
    setChecklistItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (checklistItems.length > 1) {
      const newItems = checklistItems.filter((_, i) => i !== index);
      setChecklistItems(newItems);
    }
  };

  const handleSaveClick = () => {
    if (!title.trim()) {
      toast({ title: "Title is required", variant: "destructive" });
      return;
    }
    const content = type === 'text' 
      ? textContent 
      : checklistItems.filter(item => item.text.trim() !== '');

    if ((type === 'text' && (content as string).trim() === '') || (type === 'checklist' && (content as any[]).length === 0)) {
        toast({ title: "Note content cannot be empty", variant: "destructive" });
        return;
    }
    
    const updatedNote: Note = {
      ...note,
      title,
      content,
      type,
    };
    onSave(updatedNote);
  };

  return (
    <Card className="flex flex-col h-full border-primary border-2 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-center gap-2">
          <Input 
            placeholder="Note Title..." 
            value={title} 
            onChange={(e) => setTitle(e.target.value)} 
            className="text-lg font-headline font-bold border-0 shadow-none focus-visible:ring-0 p-0 h-auto" 
          />
        </div>
        <Select value={type} onValueChange={(v) => setType(v as 'text' | 'checklist')}>
            <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Note Type" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="text">Text Note</SelectItem>
                <SelectItem value="checklist">Checklist</SelectItem>
            </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        {type === 'text' ? (
          <Textarea
            placeholder="Type your note here..."
            className="flex-grow resize-none border-0 focus-visible:ring-0 p-0"
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
          />
        ) : (
          <ScrollArea className="flex-grow h-48 pr-4">
            <div className="space-y-2">
              {checklistItems.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Checkbox checked={item.completed} onCheckedChange={(checked) => handleItemCompletionChange(index, !!checked)} />
                  <Input
                    value={item.text}
                    onChange={(e) => handleItemTextChange(index, e.target.value)}
                    placeholder={`List item ${index + 1}`}
                    className="h-8"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive flex-shrink-0" onClick={() => handleRemoveItem(index)} disabled={checklistItems.length <= 1}>
                      <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={handleAddItem} className="mt-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>
          </ScrollArea>
        )}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-2">
        <div>
            <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(note.id)}>
                <Trash2 className="mr-2 h-4 w-4"/> Delete
            </Button>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button onClick={handleSaveClick}><Save className="mr-2 h-4 w-4"/>Save</Button>
        </div>
      </CardFooter>
    </Card>
  );
}


function NoteCard({ note, onEdit, onView }: { note: Note; onEdit: () => void; onView: () => void }) {
  return (
    <Card className="flex flex-col h-96 hover:shadow-lg transition-shadow duration-300">
      <div onClick={onView} className="cursor-pointer flex-grow flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="font-headline text-lg">{note.title}</CardTitle>
            <div className="text-xs text-muted-foreground pt-1 flex items-center gap-2">
                <span>{format(parseISO(note.createdAt), 'MMM d, yyyy')}</span>
                <Badge variant="outline" className="capitalize">{note.type}</Badge>
            </div>
          </CardHeader>
          <CardContent className="flex-grow flex flex-col min-h-0">
            <ScrollArea className="flex-grow pr-4">
                {note.type === 'text' && (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{String(note.content)}</p>
                )}
                {note.type === 'checklist' && Array.isArray(note.content) && (
                  <ul className="space-y-2">
                    {note.content.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <Checkbox checked={item.completed} disabled />
                        <span className={cn(item.completed && 'line-through text-muted-foreground')}>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </ScrollArea>
          </CardContent>
      </div>
      <CardFooter className="pt-4 flex-shrink-0">
          <Button variant="outline" size="sm" className="w-full" onClick={onEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Note
          </Button>
      </CardFooter>
    </Card>
  );
}

export default function NotesPage() {
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [layout, setLayout] = useState<Layout>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [viewingNote, setViewingNote] = useState<Note | null>(null);

  useEffect(() => {
    try {
      const storedNotes = localStorage.getItem(LOCAL_STORAGE_KEY_NOTES);
      setNotes(storedNotes ? JSON.parse(storedNotes) : P_NOTES);
    } catch (e) {
      console.error("Failed to load notes", e);
      setNotes(P_NOTES);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTES, JSON.stringify(notes));
    }
  }, [notes, isLoading]);


  const handleSaveNote = (newNoteData: Omit<Note, 'id' | 'createdAt'>) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      createdAt: formatISO(new Date()),
      ...newNoteData,
    };
    setNotes(prev => [newNote, ...prev]);
    setIsAddingNote(false);
    toast({ title: "Note Saved!", description: `"${newNote.title}" has been added.` });
  };
  
  const handleUpdateNote = (updatedNote: Note) => {
    setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n));
    setEditingNoteId(null);
    toast({ title: "Note Updated!", description: `"${updatedNote.title}" has been saved.` });
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => prev.filter(note => note.id !== noteId));
    setEditingNoteId(null);
    toast({ title: "Note Deleted", variant: "destructive" });
  };
  
  const handleCancelNewNote = () => {
    setIsAddingNote(false);
  };

  const filteredNotes = notes.filter(note => {
    const titleMatch = note.title.toLowerCase().includes(searchTerm.toLowerCase());
    let contentMatch = false;
    if (typeof note.content === 'string') {
        contentMatch = note.content.toLowerCase().includes(searchTerm.toLowerCase());
    } else if (Array.isArray(note.content)) {
        contentMatch = note.content.some(item => item.text.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return titleMatch || contentMatch;
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <header>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-headline">Personal Notes</h1>
              <p className="text-muted-foreground">Your digital canvas for thoughts and ideas.</p>
            </div>
            <Button onClick={() => { setIsAddingNote(true); setEditingNoteId(null); }} disabled={isAddingNote || !!editingNoteId}>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Note
            </Button>
          </div>
          <div className="mt-4 flex gap-2">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search notes..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant={layout === 'grid' ? 'default' : 'outline'} size="icon" onClick={() => setLayout('grid')}>
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={layout === 'list' ? 'default' : 'outline'} size="icon" onClick={() => setLayout('list')}>
                <List className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className={cn(
            'grid gap-6',
            layout === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
        )}>
          {isAddingNote && (
            <NewNoteCard onSave={handleSaveNote} onCancel={handleCancelNewNote} />
          )}

          {filteredNotes.map((note) => (
            editingNoteId === note.id ? (
              <EditNoteCard
                key={note.id}
                note={note}
                onSave={handleUpdateNote}
                onCancel={() => setEditingNoteId(null)}
                onDelete={handleDeleteNote}
              />
            ) : (
              <NoteCard
                key={note.id}
                note={note}
                onView={() => {
                    if (isAddingNote || editingNoteId) return;
                    setViewingNote(note)
                }}
                onEdit={() => {
                  if (isAddingNote) setIsAddingNote(false);
                  setEditingNoteId(note.id);
                }}
              />
            )
          ))}
        </div>
        {!isAddingNote && !editingNoteId && filteredNotes.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <p>No notes found.</p>
                <p className="text-sm">Click "New Note" to get started.</p>
            </div>
        )}
      </div>
      <ViewNoteDialog
        note={viewingNote}
        isOpen={!!viewingNote}
        onOpenChange={(open) => !open && setViewingNote(null)}
       />
    </AppLayout>
  );
}
