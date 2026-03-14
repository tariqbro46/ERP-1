import React, { useState, useEffect } from 'react';
import { Plus, Search, StickyNote, Trash2, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

interface Note {
  id: string;
  title: string;
  content: string;
  date: string;
}

export function Notes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    const saved = localStorage.getItem('tallyflow_notes');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Pending VAT Filing', content: 'Need to check the input tax credit for Feb 2024.', date: '04-Mar-2024' },
      { id: '2', title: 'Supplier Meeting', content: 'Discuss bulk discount for raw materials next quarter.', date: '03-Mar-2024' },
    ];
  });
  const [activeNote, setActiveNote] = useState<Note | null>(notes[0] || null);

  useEffect(() => {
    localStorage.setItem('tallyflow_notes', JSON.stringify(notes));
  }, [notes]);

  const addNote = () => {
    const newNote = {
      id: Date.now().toString(),
      title: 'New Note',
      content: '',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-')
    };
    setNotes([newNote, ...notes]);
    setActiveNote(newNote);
  };

  const updateNote = (id: string, field: keyof Note, value: string) => {
    setNotes(notes.map(n => n.id === id ? { ...n, [field]: value } : n));
    if (activeNote?.id === id) {
      setActiveNote({ ...activeNote, [field]: value });
    }
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter(n => n.id !== id));
    if (activeNote?.id === id) setActiveNote(null);
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background font-mono transition-colors overflow-hidden">
      {/* Sidebar */}
      <div className={cn(
        "w-full lg:w-80 border-r border-border flex flex-col transition-all",
        activeNote && "hidden lg:flex"
      )}>
        <div className="p-4 border-b border-border flex justify-between items-center bg-card">
          <h2 className="text-[11px] uppercase tracking-widest text-gray-500">Memos & Notes</h2>
          <button onClick={addNote} className="p-1 hover:bg-foreground/10 rounded transition-colors">
            <Plus className="w-4 h-4 text-foreground" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {notes.map(note => (
            <div
              key={note.id}
              onClick={() => setActiveNote(note)}
              className={`p-4 border-b border-border cursor-pointer transition-colors group ${
                activeNote?.id === note.id ? 'bg-foreground/5' : 'hover:bg-foreground/5'
              }`}
            >
              <h3 className="text-sm text-foreground truncate mb-1">{note.title || 'Untitled Note'}</h3>
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-gray-600 uppercase">{note.date}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                  className="p-1 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor */}
      <div className={cn(
        "flex-1 flex flex-col bg-background transition-all",
        !activeNote && "hidden lg:flex"
      )}>
        {activeNote ? (
          <>
            <div className="p-4 lg:p-6 border-b border-border bg-card flex items-center gap-4">
              <button 
                onClick={() => setActiveNote(null)}
                className="p-2 hover:bg-foreground/5 rounded lg:hidden"
              >
                <ArrowLeft className="w-4 h-4 text-gray-500" />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={activeNote.title || ''}
                  onChange={(e) => updateNote(activeNote.id, 'title', e.target.value)}
                  className="w-full bg-transparent border-none text-xl lg:text-2xl text-foreground outline-none placeholder:text-gray-400"
                  placeholder="Note Title"
                />
                <div className="mt-1 text-[9px] lg:text-[10px] text-gray-600 uppercase tracking-widest">
                  Last Edited: {activeNote.date}
                </div>
              </div>
            </div>
            <div className="flex-1 p-4 lg:p-6">
              <textarea
                value={activeNote.content || ''}
                onChange={(e) => updateNote(activeNote.id, 'content', e.target.value)}
                className="w-full h-full bg-transparent border-none text-foreground/80 outline-none resize-none leading-relaxed text-sm lg:text-base"
                placeholder="Start typing your memo..."
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-6 text-center">
            <StickyNote className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-sm uppercase tracking-widest opacity-50">Select a note to view or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}
