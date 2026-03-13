'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { AppBar, Toolbar, Button } from 'react95';
import { useDesktopStore } from '@/store/useDesktopStore';

const TaskbarContainer = styled(AppBar)`
  top: auto;
  bottom: 0;
  z-index: 10000;
`;

const StartButton = styled(Button)`
  font-weight: bold;
  margin-right: 4px;
`;

const AppTabsContainer = styled.div`
  display: flex;
  flex: 1;
  gap: 4px;
  overflow-x: auto;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const AppTab = styled(Button)`
  min-width: 120px;
  max-width: 160px;
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  justify-content: flex-start;
`;

const Clock = styled.div`
  padding: 0 10px;
  border-left: 2px solid #868a8e;
  display: flex;
  align-items: center;
  height: 100%;
`;

export default function Taskbar() {
    const { windows, activeWindowId, focusApp, minimizeApp, toggleStartMenu, startMenuOpen } = useDesktopStore();
    const [time, setTime] = useState<string>('');

    useEffect(() => {
        const updateTime = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const handleAppClick = (appId: string, isMinimized: boolean) => {
        if (activeWindowId === appId) {
            if (!isMinimized) {
                minimizeApp(appId);
            }
        } else {
            if (isMinimized) {
                minimizeApp(appId); // toggles to un-minimized
            }
            focusApp(appId);
        }
    };

    return (
        <TaskbarContainer position="fixed">
            <Toolbar style={{ justifyContent: 'space-between', padding: '0 4px', height: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                    <StartButton
                        onClick={toggleStartMenu}
                        active={startMenuOpen}
                        style={{ 
                          padding: '0px', 
                          minWidth: '100px', 
                          height: '34px', 
                          margin: '3px 4px',
                          backgroundImage: 'url(/icons/windows-start.png)',
                          backgroundSize: 'cover', // Automatically scale to width
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          border: 'none',
                          backgroundColor: 'transparent'
                        }}
                    >
                    </StartButton>

                    <AppTabsContainer>
                        {windows.map((w) => (
                            <AppTab
                                key={w.id}
                                active={activeWindowId === w.id && !w.isMinimized}
                                onClick={() => handleAppClick(w.id, w.isMinimized)}
                            >
                                {w.appName}
                            </AppTab>
                        ))}
                    </AppTabsContainer>
                </div>

                <Clock>{time}</Clock>
            </Toolbar>
        </TaskbarContainer>
    );
}
