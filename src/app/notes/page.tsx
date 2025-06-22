'use client';

import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import type { Note } from '@/types';
import { P_NOTES } from '@/lib/placeholder-data';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, LayoutGrid, List } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { format, parseISO } from 'date-fns';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

type Layout = 'grid' | 'list';

function NoteCard({ note, layout }: { note: Note; layout: Layout }) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="font-headline text-lg">{note.title}</CardTitle>
        <div className="text-xs text-muted-foreground pt-1 flex items-center gap-2">
            <span>{format(parseISO(note.createdAt), 'MMM d, yyyy')}</span>
            <Badge variant="outline" className="capitalize">{note.type}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {note.type === 'text' && (
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{String(note.content).substring(0, layout === 'grid' ? 150 : 1000)}{String(note.content).length > 150 && layout === 'grid' ? '...' : ''}</p>
        )}
        {note.type === 'checklist' && Array.isArray(note.content) && (
          <ul className="space-y-2">
            {(layout === 'grid' ? note.content.slice(0, 4) : note.content).map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <Checkbox checked={item.completed} disabled />
                <span className={cn(item.completed && 'line-through text-muted-foreground')}>{item.text}</span>
              </li>
            ))}
            {note.content.length > 4 && layout === 'grid' && (
                <li className="text-sm text-muted-foreground">...and {note.content.length - 4} more</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(P_NOTES);
  const [searchTerm, setSearchTerm] = useState('');
  const [layout, setLayout] = useState<Layout>('grid');

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
            <Button>
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
          {filteredNotes.map((note) => (
            <NoteCard key={note.id} note={note} layout={layout} />
          ))}
        </div>
        {filteredNotes.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
                <p>No notes found.</p>
            </div>
        )}
      </div>
    </AppLayout>
  );
}
