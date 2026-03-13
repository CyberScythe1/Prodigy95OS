import { collection, doc, setDoc, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Note, Topic } from '@/store/useNotesStore';

export const notesApi = {
  // Topics
  getTopics: async (userId: string): Promise<Topic[]> => {
    const q = query(collection(db, 'topics'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name, userId: doc.data().user_id }));
  },
  
  createTopic: async (userId: string, name: string): Promise<Topic> => {
    const newDocRef = doc(collection(db, 'topics'));
    const newTopic = { user_id: userId, name, created_at: Date.now() };
    await setDoc(newDocRef, newTopic);
    return { id: newDocRef.id, name, userId };
  },

  deleteTopic: async (topicId: string) => {
    await deleteDoc(doc(db, 'topics', topicId));
  },

  // Notes
  getNotes: async (userId: string): Promise<Note[]> => {
    const q = query(collection(db, 'notes'), where('user_id', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      topicId: doc.data().topic_id,
      userId: doc.data().user_id,
      title: doc.data().title,
      content: doc.data().content,
      createdAt: doc.data().created_at
    }));
  },

  createNote: async (userId: string, topicId: string, title: string, content: string = ''): Promise<Note> => {
    const newDocRef = doc(collection(db, 'notes'));
    const newNote = {
      user_id: userId,
      topic_id: topicId,
      title,
      content,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    await setDoc(newDocRef, newNote);
    return { id: newDocRef.id, topicId, userId, title, content, createdAt: newNote.created_at };
  },

  updateNote: async (noteId: string, title: string, content: string) => {
    const noteRef = doc(db, 'notes', noteId);
    await updateDoc(noteRef, { title, content, updated_at: Date.now() });
  },

  deleteNote: async (noteId: string) => {
    await deleteDoc(doc(db, 'notes', noteId));
  }
};
