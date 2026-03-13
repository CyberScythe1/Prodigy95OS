'use client';

import React, { useState, useEffect } from 'react';
import { ScrollView, Button, Divider, TextInput, List, ListItem, Anchor, Fieldset } from 'react95';
import styled from 'styled-components';
import { useNotesStore } from '@/store/useNotesStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useDesktopStore } from '@/store/useDesktopStore';

const AppContainer = styled.div`
  display: flex;
  height: 100%;
  gap: 10px;
  background: silver;
  padding: 4px;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  background: white;
  border: 2px inset #fff;
  padding: 4px;
`;

const FoldersColumn = styled(Column)`
  width: 180px;
`;

const NotesColumn = styled(Column)`
  width: 220px;
`;

const EditorColumn = styled(Column)`
  flex: 1;
`;

const EditorArea = styled.textarea`
  flex: 1;
  font-family: 'Courier New', Courier, monospace;
  padding: 10px;
  font-size: 14px;
  resize: none;
  border: 2px inset #fff;
  background: white;
  &:focus {
    outline: none;
  }
`;

export default function NotesApp() {
    const { user } = useAuthStore();
    const { openApp } = useDesktopStore();
    const { topics, notes, fetchData, addTopic, addNote, updateNote, deleteTopic, deleteNote, clearData } = useNotesStore();
    const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [newTopicName, setNewTopicName] = useState('');

    const selectedNote = notes.find(n => n.id === selectedNoteId);

    useEffect(() => {
        if (user) {
            fetchData(user.uid);
        } else {
            clearData();
        }
    }, [user, fetchData, clearData]);

    if (!user) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px' }}>
                <h2>Authentication Required</h2>
                <p>You must be connected to the network to use Notes Saver.</p>
                <Button size="lg" onClick={() => openApp('login-app', 'Network Connectivity')}>Open Login</Button>
            </div>
        );
    }

    const handleAddTopic = () => {
        if (newTopicName.trim() && user) {
            addTopic(user.uid, newTopicName.trim());
            setNewTopicName('');
        }
    };

    const handleAddNote = () => {
        if (selectedTopicId && user) {
            addNote(user.uid, selectedTopicId, 'New Note');
        }
    };

    const visibleNotes = notes.filter(n => n.topicId === selectedTopicId);

    return (
        <AppContainer>
            {/* Column 1: Folders */}
            <FoldersColumn>
                <div style={{ padding: '4px', borderBottom: '2px solid silver', marginBottom: '4px' }}>
                   <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                        <TextInput
                            placeholder="Add..."
                            value={newTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            style={{ flex: 1 }}
                        />
                        <Button onClick={handleAddTopic} disabled={!newTopicName.trim()}>+</Button>
                    </div>
                    <Button
                        disabled={!selectedTopicId}
                        onClick={() => {
                            if (selectedTopicId) {
                                deleteTopic(selectedTopicId);
                                setSelectedTopicId(null);
                                setSelectedNoteId(null);
                            }
                        }}
                        fullWidth
                        size="sm"
                    >
                        Delete Folder
                    </Button>
                </div>
                <ScrollView style={{ flex: 1 }}>
                    <List fullWidth style={{ border: 'none' }}>
                        {topics.map(topic => (
                            <ListItem
                                key={topic.id}
                                onClick={() => { setSelectedTopicId(topic.id); setSelectedNoteId(null); }}
                                style={{ fontWeight: 'bold', background: selectedTopicId === topic.id ? '#000080' : 'transparent', color: selectedTopicId === topic.id ? 'white' : 'black' }}
                            >
                                📁 {topic.name}
                            </ListItem>
                        ))}
                    </List>
                </ScrollView>
            </FoldersColumn>

            {/* Column 2: Notes */}
            <NotesColumn>
                <div style={{ padding: '4px', borderBottom: '2px solid silver', marginBottom: '4px' }}>
                    <Button
                        disabled={!selectedTopicId}
                        onClick={handleAddNote}
                        fullWidth
                        size="sm"
                    >
                        + New Note
                    </Button>
                </div>
                <ScrollView style={{ flex: 1 }}>
                    <List fullWidth style={{ border: 'none' }}>
                        {!selectedTopicId && <div style={{ padding: 10, color: '#888', fontSize: '12px' }}>Pick a folder.</div>}
                        {selectedTopicId && visibleNotes.length === 0 && <div style={{ padding: 10, color: '#888', fontSize: '12px' }}>Empty.</div>}
                        {visibleNotes.map(note => (
                            <ListItem
                                key={note.id}
                                onClick={() => setSelectedNoteId(note.id)}
                                style={{ background: selectedNoteId === note.id ? '#000080' : 'transparent', color: selectedNoteId === note.id ? 'white' : 'black', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                            >
                                📄 {note.title || 'Untitled'}
                            </ListItem>
                        ))}
                    </List>
                </ScrollView>
            </NotesColumn>

            {/* Column 3: Editor */}
            <EditorColumn>
                {selectedNote ? (
                    <>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <TextInput
                                value={selectedNote.title}
                                onChange={(e) => updateNote(selectedNote.id, selectedNote.content, e.target.value)}
                                style={{ flex: 1, fontWeight: 'bold' }}
                                placeholder="Note Title"
                            />
                            <Button onClick={() => {
                                deleteNote(selectedNote.id);
                                setSelectedNoteId(null);
                            }}>
                                Delete
                            </Button>
                        </div>
                        <EditorArea
                            value={selectedNote.content}
                            onChange={(e) => updateNote(selectedNote.id, e.target.value)}
                            placeholder="Start typing your note here..."
                        />
                    </>
                ) : (
                    <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#c0c0c0', color: 'black', textAlign: 'center', padding: '20px' }}>
                        Select a folder and a note to begin.
                    </div>
                )}
            </EditorColumn>
        </AppContainer>
    );
}
