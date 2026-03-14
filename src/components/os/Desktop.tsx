'use client';

import React from 'react';
import styled from 'styled-components';
import { useDesktopStore } from '@/store/useDesktopStore';

const DesktopContainer = styled.div`
  width: 100vw;
  height: calc(100vh - 40px); /* Leave room for taskbar */
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  align-content: flex-start;
  padding: 10px;
  gap: 20px;
`;

const Watermark = styled.div`
  position: absolute;
  bottom: 20px;
  right: 20px;
  font-family: 'MS Sans Serif', Arial;
  color: rgba(255, 255, 255, 0.3);
  pointer-events: none;
  text-align: right;
  z-index: 0;

  h1 {
    font-size: 48px;
    margin: 0;
    font-weight: bold;
    letter-spacing: -1px;
  }
  p {
    font-size: 14px;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 2px;
  }
`;

const Attribution = styled.p`
  font-size: 12px;
  margin-top: 4px;
  opacity: 0.6;
  text-transform: none;
  letter-spacing: normal;
`;

export default function Desktop({ children }: { children: React.ReactNode }) {
    const { closeStartMenu } = useDesktopStore();
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <DesktopContainer onClick={closeStartMenu} style={{ padding: isMobile ? '5px' : '10px', gap: isMobile ? '10px' : '20px' }}>
            <Watermark style={{ opacity: isMobile ? 0.4 : 1, transform: isMobile ? 'scale(0.8)' : 'none', transformOrigin: 'bottom right' }}>
                <h1>Prodigy95 OS</h1>
                <p>AI Operating System</p>
                <Attribution>Made By King Prithvi</Attribution>
            </Watermark>
            {children}
        </DesktopContainer>
    );
}
