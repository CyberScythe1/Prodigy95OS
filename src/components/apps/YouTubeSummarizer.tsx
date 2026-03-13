'use client';

import React, { useState, useEffect } from 'react';
import { ScrollView, TextInput, Button, Fieldset, ProgressBar, Select } from 'react95';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotesStore } from '@/store/useNotesStore';

export default function YouTubeSummarizer() {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<any | null>(null);

    const { user } = useAuthStore();
    const { topics, addNote, fetchData } = useNotesStore();
    const [selectedTopic, setSelectedTopic] = useState<string>('');
    const [saving, setSaving] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (user && topics.length === 0) {
            fetchData(user.uid);
        }
    }, [user, topics.length, fetchData]);

    // Set default topic if topics load
    useEffect(() => {
        if (topics.length > 0 && !selectedTopic) {
            setSelectedTopic(topics[0].id);
        }
    }, [topics, selectedTopic]);

    const handleSummarize = async () => {
        if (!url.trim()) return;
        
        setLoading(true);
        setResult(null);
        setProgress(10); // Start progress

        try {
            const progressInterval = setInterval(() => {
                setProgress(p => (p < 90 ? p + 5 : p));
            }, 500);

            const response = await fetch('/api/youtube-summarizer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            
            clearInterval(progressInterval);
            setProgress(100);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to summarize video');
            }

            setResult(data);
        } catch (err: any) {
            console.error(err);
            setResult({ title: 'Error', summary: err.message, bullets: [] });
        } finally {
            setTimeout(() => setLoading(false), 500); 
        }
    };

    const handleSaveToNotes = async () => {
        if (!user || !selectedTopic || !result || result.title === 'Error') return;
        setSaving(true);
        try {
            const content = `${result.summary}\n\nKey Insights:\n${result.bullets.map((b: string) => `- ${b}`).join('\n')}`;
            await addNote(user.uid, selectedTopic, result.title, content);
            alert('Saved to notes successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save to notes.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: isMobile ? '5px' : '10px' }}>
            <Fieldset label="Enter YouTube URL">
                <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                    <TextInput
                        placeholder="https://youtube.com/watch?v=..."
                        fullWidth
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                    />
                    <Button onClick={handleSummarize} disabled={loading || !url.trim()} fullWidth={isMobile}>
                        Summarize
                    </Button>
                </div>
            </Fieldset>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 5px' }}>
                    <span style={{ fontSize: '12px', minWidth: isMobile ? 'auto' : '90px' }}>{isMobile ? '...' : 'Processing...'}</span>
                    <ProgressBar value={progress} style={{ flex: 1 }} />
                </div>
            )}

            <ScrollView style={{ flex: 1, backgroundColor: 'white', padding: '15px', overflowY: 'auto' }}>
                {result ? (
                    <div>
                        <h3 style={{ marginTop: 0 }}>{result.title}</h3>
                        <p style={{ lineHeight: 1.5 }}>{result.summary}</p>
                        <h4 style={{ marginBottom: '8px' }}>Key Insights</h4>
                        <ul style={{ paddingLeft: '20px', marginTop: 0 }}>
                            {result.bullets.map((bullet: string, i: number) => (
                                <li key={i} style={{ marginBottom: '4px' }}>{bullet}</li>
                            ))}
                        </ul>

                        {user && result.title !== 'Error' && (
                            <div style={{ marginTop: '20px', padding: '10px', borderTop: '2px solid #dfdfdf', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                                <span style={{ fontWeight: 'bold' }}>Save to Network:</span>
                                {topics.length > 0 ? (
                                    <>
                                        <Select 
                                            options={topics.map(t => ({ value: t.id, label: t.name }))}
                                            value={selectedTopic}
                                            onChange={(opt: any) => setSelectedTopic(opt.value)}
                                            width={150}
                                        />
                                        <Button onClick={handleSaveToNotes} disabled={saving || !selectedTopic}>
                                            {saving ? 'Saving...' : '💾 Save as Note'}
                                        </Button>
                                    </>
                                ) : (
                                    <span style={{ fontSize: '12px', color: '#666' }}>Create a folder in Notes Saver first.</span>
                                )}
                            </div>
                        )}
                        {!user && result.title !== 'Error' && (
                            <div style={{ marginTop: '20px', padding: '10px', borderTop: '2px solid #dfdfdf', fontSize: '12px', color: '#666' }}>
                                Log in to Network Connectivity to save summaries to your Notes.
                            </div>
                        )}
                    </div>
                ) : !loading ? (
                    <div style={{ color: '#888', textAlign: 'center', marginTop: '20px' }}>
                        Paste a link and click Summarize to generate AI insights.
                    </div>
                ) : null}
            </ScrollView>
        </div>
    );
}
