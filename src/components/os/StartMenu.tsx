'use client';

import React from 'react';
import styled from 'styled-components';
import { List, ListItem, Divider } from 'react95';
import { useDesktopStore } from '@/store/useDesktopStore';
import { useAuthStore } from '@/store/useAuthStore';
import { auth } from '@/lib/firebase';

const StartMenuContainer = styled.div`
  position: absolute;
  bottom: 0;
  left: 4px;
  z-index: 10001;
  display: flex;
  background: silver;
  border-top: 2px solid white;
  border-left: 2px solid white;
  border-right: 2px solid black;
  border-bottom: 2px solid black;
  padding: 2px;
  box-shadow: 2px 2px 5px rgba(0,0,0,0.5);
`;

const SidebarBrand = styled.div`
  background: linear-gradient(0deg, #000080, #1084d0);
  color: white;
  width: 32px;
  min-height: 250px;
  display: flex;
  align-items: flex-end;
  padding-bottom: 15px;
  padding-left: 2px;
`;

const BrandText = styled.h2`
  transform: rotate(-90deg);
  transform-origin: bottom left;
  white-space: nowrap;
  font-family: Arial, sans-serif;
  font-size: 20px;
  font-weight: bold;
  letter-spacing: 1px;
  margin: 0;
  margin-left: 24px;
`;

const AttributionText = styled.div`
  transform: rotate(-90deg);
  transform-origin: bottom left;
  white-space: nowrap;
  font-family: Arial, sans-serif;
  font-size: 10px;
  font-weight: bold;
  margin-left: 10px;
  margin-bottom: 110px;
  opacity: 0.8;
`;

export default function StartMenu() {
    const { startMenuOpen, openApp, toggleStartMenu } = useDesktopStore();
    const { user } = useAuthStore();

    if (!startMenuOpen) return null;

    const handleLaunchApp = (id: string, name: string) => {
        openApp(id, name);
        toggleStartMenu();
    };

    const handleAuth = () => {
        if (user) {
            auth.signOut();
        } else {
            openApp('login-app', 'Network Connectivity');
        }
        toggleStartMenu();
    };

    return (
        <StartMenuContainer>
            <SidebarBrand>
                <BrandText><strong>Prodigy95</strong> OS</BrandText>
                <AttributionText>Made By King Prithvi</AttributionText>
            </SidebarBrand>
            <List horizontalAlign="left" verticalAlign="bottom" style={{ boxShadow: 'none', border: 'none', margin: 0, padding: 0 }}>
                <ListItem onClick={() => handleLaunchApp('youtube-summarizer', 'YouTube Summarizer')}>
                    <span role="img" aria-label="video">📹</span> YouTube Summarizer
                </ListItem>
                <ListItem onClick={() => handleLaunchApp('notes-app', 'Notes Saver')}>
                    <span role="img" aria-label="notes">📝</span> Notes Saver
                </ListItem>
                <ListItem onClick={() => handleLaunchApp('job-search', 'Job Search')}>
                    <span role="img" aria-label="jobs">💼</span> AI Job Search
                </ListItem>
                <ListItem onClick={() => handleLaunchApp('minesweeper', 'Minesweeper')}>
                    <span role="img" aria-label="bomb">💣</span> Minesweeper
                </ListItem>

                <Divider />

                <ListItem disabled>⚙️ Settings</ListItem>
                <ListItem disabled>🔍 Help</ListItem>
                <Divider />
                <ListItem onClick={handleAuth}>
                    {user ? 'Log Out...' : 'Log In...'}
                </ListItem>
            </List>
        </StartMenuContainer>
    );
}
