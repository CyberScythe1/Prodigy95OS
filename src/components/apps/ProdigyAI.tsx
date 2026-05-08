'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ScrollView, TextInput, Button, Fieldset, ProgressBar } from 'react95';
import { useAuthStore } from '@/store/useAuthStore';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export default function ProdigyAI() {
    const { user } = useAuthStore();
    const [input, setInput] = useState('');
    const [history, setHistory] = useState<Message[]>([
        { sender: 'bot', text: 'Hello! I am Prodigy AI. How can I assist you today?' }
    ]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history, loading]);

    const handleSend = async () => {
        if (!input.trim()) return;
        
        const userMsg = input.trim();
        setInput('');
        setHistory(prev => [...prev, { sender: 'user', text: userMsg }]);
        
        setLoading(true);
        setProgress(10); 

        try {
            const progressInterval = setInterval(() => {
                setProgress(p => (p < 90 ? p + 5 : p));
            }, 500);

            const response = await fetch('/api/prodigy-ai', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ question: userMsg, history: history.slice(-6) }) // Send last 6 messages
            });

            const data = await response.json();
            
            clearInterval(progressInterval);
            setProgress(100);

            if (!response.ok) {
                throw new Error(data.error || 'Failed to get response');
            }

            setHistory(prev => [...prev, { sender: 'bot', text: data.answer }]);
        } catch (err: any) {
            console.error(err);
            setHistory(prev => [...prev, { sender: 'bot', text: `Error: ${err.message}` }]);
        } finally {
            setTimeout(() => setLoading(false), 500); 
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: isMobile ? '5px' : '10px' }}>
            <ScrollView 
                style={{ flex: 1, backgroundColor: 'white', padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}
                ref={scrollRef as any}
            >
                {history.map((msg, i) => (
                    <div key={i} style={{ 
                        marginBottom: '10px', 
                        display: 'flex', 
                        flexDirection: 'column',
                        alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                        <div style={{
                            backgroundColor: msg.sender === 'user' ? '#000080' : '#e0e0e0',
                            color: msg.sender === 'user' ? 'white' : 'black',
                            padding: '8px 12px',
                            borderRadius: '8px',
                            maxWidth: '80%',
                            fontFamily: 'sans-serif',
                            lineHeight: 1.4,
                            whiteSpace: 'pre-wrap',
                            border: msg.sender === 'bot' ? '2px inset #dfdfdf' : 'none'
                        }}>
                            {msg.text}
                        </div>
                    </div>
                ))}
            </ScrollView>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 5px' }}>
                    <span style={{ fontSize: '12px', minWidth: isMobile ? 'auto' : '90px' }}>{isMobile ? '...' : 'Thinking...'}</span>
                    <ProgressBar value={progress} style={{ flex: 1 }} />
                </div>
            )}

            <Fieldset label="Message Prodigy AI" style={{ marginBottom: 0 }}>
                {user ? (
                    <div style={{ display: 'flex', gap: '8px', flexDirection: isMobile ? 'column' : 'row' }}>
                        <TextInput
                            placeholder="Type a message..."
                            fullWidth
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            disabled={loading}
                        />
                        <Button onClick={handleSend} disabled={loading || !input.trim()} fullWidth={isMobile}>
                            Send
                        </Button>
                    </div>
                ) : (
                    <div style={{ padding: '10px', textAlign: 'center', color: '#666', fontSize: '12px' }}>
                        Please log in to Network Connectivity to use Prodigy AI.
                    </div>
                )}
            </Fieldset>
        </div>
    );
}
