'use client';

import React, { useEffect } from 'react';
import Desktop from '@/components/os/Desktop';
import Taskbar from '@/components/os/Taskbar';
import StartMenu from '@/components/os/StartMenu';
import WindowManager from '@/components/os/WindowManager';
import DesktopIcon from '@/components/os/DesktopIcon';
import YouTubeSummarizer from '@/components/apps/YouTubeSummarizer';
import NotesApp from '@/components/apps/NotesApp';
import JobSearchApp from '@/components/apps/JobSearchApp';
import LoginApp from '@/components/apps/LoginApp';
import Minesweeper from '@/components/apps/Minesweeper';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/useAuthStore';

export default function Home() {
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    // Listen for Firebase Auth state changes globally
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [setUser, setLoading]);
  return (
    <main style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Desktop>
        {/* Desktop Icons */}
        <DesktopIcon id="login-app" name="Network Login" emoji="🔑" color="#008080" />
        <DesktopIcon id="youtube-summarizer" name="YouTube Summarizer" emoji="📹" color="#FF0000" />
        <DesktopIcon id="notes-app" name="Notes Saver" emoji="📝" color="#FFFF00" />
        <DesktopIcon id="job-search" name="AI Job Search" emoji="💼" color="#0000FF" />
        <DesktopIcon id="minesweeper" name="Minesweeper" emoji="💣" color="#4a4a4a" />

        {/* Applications */}
        <WindowManager id="youtube-summarizer" appName="YouTube Summarizer">
          <YouTubeSummarizer />
        </WindowManager>

        <WindowManager id="notes-app" appName="Notes Saver">
          <NotesApp />
        </WindowManager>

        <WindowManager id="job-search" appName="AI Job Search">
          <JobSearchApp />
        </WindowManager>

        <WindowManager id="login-app" appName="Network Connectivity">
          <LoginApp />
        </WindowManager>

        <WindowManager id="minesweeper" appName="Minesweeper">
          <Minesweeper />
        </WindowManager>

        <StartMenu />
      </Desktop>

      <Taskbar />
    </main>
  );
}
