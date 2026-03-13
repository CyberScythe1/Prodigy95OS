'use client';

import { create } from 'zustand';
import { notesApi } from '@/lib/notesApi';

export interface Note {
  id: string;
  topicId: string;
  userId?: string;
  title: string;
  content: string;
  createdAt: number;
}

export interface Topic {
  id: string;
  userId?: string;
  name: string;
}

interface NotesState {
  topics: Topic[];
  notes: Note[];
  loading: boolean;
  
  // Actions
  fetchData: (userId: string) => Promise<void>;
  addTopic: (userId: string, name: string) => Promise<void>;
  deleteTopic: (topicId: string) => Promise<void>;
  
  addNote: (userId: string, topicId: string, title: string, content?: string) => Promise<void>;
  updateNote: (noteId: string, content: string, title?: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  
  clearData: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  topics: [],
  notes: [],
  loading: false,

  fetchData: async (userId: string) => {
    set({ loading: true });
    try {
      const dbTopics = await notesApi.getTopics(userId);
      const dbNotes = await notesApi.getNotes(userId);
      set({ topics: dbTopics, notes: dbNotes, loading: false });
    } catch (e) {
      console.error(e);
      set({ loading: false });
    }
  },

  addTopic: async (userId: string, name: string) => {
    const newTopic = await notesApi.createTopic(userId, name);
    set((state) => ({ topics: [...state.topics, newTopic] }));
  },

  deleteTopic: async (topicId) => {
    await notesApi.deleteTopic(topicId);
    set((state) => ({
      topics: state.topics.filter(t => t.id !== topicId),
      notes: state.notes.filter(n => n.topicId !== topicId) 
    }));
  },

  addNote: async (userId: string, topicId: string, title: string, content: string = '') => {
    const newNote = await notesApi.createNote(userId, topicId, title, content);
    set((state) => ({ notes: [...state.notes, newNote] }));
  },

  updateNote: async (noteId: string, content: string, title?: string) => {
    // Optimistic UI update
    const currentNote = get().notes.find(n => n.id === noteId);
    const updatedTitle = title ?? currentNote?.title ?? '';
    
    set((state) => ({
      notes: state.notes.map(n => 
        n.id === noteId ? { ...n, content, title: updatedTitle } : n
      )
    }));
    
    // Background sync
    try {
      await notesApi.updateNote(noteId, updatedTitle, content);
    } catch (e) {
      console.error('Failed to save note', e);
    }
  },

  deleteNote: async (noteId: string) => {
    await notesApi.deleteNote(noteId);
    set((state) => ({ notes: state.notes.filter(n => n.id !== noteId) }));
  },

  clearData: () => set({ topics: [], notes: [] })
}));
