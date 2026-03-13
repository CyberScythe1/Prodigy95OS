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
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateTime = () => setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        updateTime();
        const interval = setInterval(updateTime, 1000);
        
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', checkMobile);
        };
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
            <Toolbar style={{ justifyContent: 'space-between', padding: isMobile ? '0 2px' : '0 4px', height: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', flex: 1, overflow: 'hidden' }}>
                    <StartButton
                        onClick={toggleStartMenu}
                        active={startMenuOpen}
                        style={{ 
                          padding: '0px', 
                          minWidth: isMobile ? '80px' : '100px', 
                          height: '34px', 
                          margin: isMobile ? '3px 2px' : '3px 4px',
                          backgroundImage: 'url(/icons/windows-start.png)',
                          backgroundSize: 'cover',
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
                                style={{ minWidth: isMobile ? '40px' : '120px' }}
                            >
                                {isMobile ? w.appName.substring(0, 3) + '..' : w.appName}
                            </AppTab>
                        ))}
                    </AppTabsContainer>
                </div>

                <Clock style={{ padding: isMobile ? '0 5px' : '0 10px', fontSize: isMobile ? '12px' : 'inherit' }}>{time}</Clock>
            </Toolbar>
        </TaskbarContainer>
    );
}
