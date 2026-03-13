'use client';

import React from 'react';
import styled from 'styled-components';
import { Rnd } from 'react-rnd';
import { Window, WindowHeader, WindowContent, Button } from 'react95';
import { useDesktopStore } from '@/store/useDesktopStore';

export default function WindowManager({
    id,
    appName,
    children,
}: {
    id: string;
    appName: string;
    children: React.ReactNode;
}) {
    const {
        windows,
        closeApp,
        toggleMaximizeApp,
        focusApp,
        activeWindowId,
        updateWindowPosition,
        updateWindowSize
    } = useDesktopStore();

    const windowState = windows.find(w => w.id === id);
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    if (!windowState || windowState.isMinimized) {
        return null;
    }

    const isEffectiveMaximized = windowState.isMaximized || isMobile;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleDragStop = (e: any, d: any) => {
        updateWindowPosition(id, { x: d.x, y: d.y });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleResizeStop = (e: any, direction: any, ref: any, delta: any, position: any) => {
        updateWindowSize(id, {
            width: parseInt(ref.style.width, 10),
            height: parseInt(ref.style.height, 10)
        });
        updateWindowPosition(id, position);
    };

    return (
        <Rnd
            size={isEffectiveMaximized ? { width: '100vw', height: '100%' } : { width: windowState.size.width, height: windowState.size.height }}
            position={isEffectiveMaximized ? { x: 0, y: 0 } : { x: windowState.position.x, y: windowState.position.y }}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            minWidth={isMobile ? '100vw' : 300}
            minHeight={200}
            bounds="parent"
            disableDragging={isEffectiveMaximized}
            enableResizing={!isEffectiveMaximized}
            dragHandleClassName="handle"
            style={{ zIndex: windowState.zIndex }}
            onMouseDown={() => focusApp(id)}
        >
            <Window style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', border: isMobile ? 'none' : undefined }}>
                <WindowHeader className={isEffectiveMaximized ? '' : 'handle'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeWindowId === id ? '#000080' : '#808080' }}>
                    <span style={{ fontSize: isMobile ? '14px' : 'inherit' }}>{appName}</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        {!isMobile && (
                            <Button onClick={(e) => { e.stopPropagation(); toggleMaximizeApp(id); }} style={{ minWidth: "24px", minHeight: "24px" }}>
                                <span style={{ fontWeight: 'bold' }}>{windowState.isMaximized ? '❐' : '□'}</span>
                            </Button>
                        )}
                        <Button onClick={(e) => { e.stopPropagation(); closeApp(id); }} style={{ minWidth: "24px", minHeight: "24px" }}>
                            <span style={{ fontWeight: 'bold', transform: 'translateY(-1px)' }}>x</span>
                        </Button>
                    </div>
                </WindowHeader>
                <WindowContent style={{ flex: 1, padding: isMobile ? '0.15rem' : '0.25rem', overflow: 'hidden' }}>
                    {children}
                </WindowContent>
            </Window>
        </Rnd>
    );
}
