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

    if (!windowState || windowState.isMinimized) {
        return null;
    }

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
            size={windowState.isMaximized ? { width: '100%', height: '100%' } : { width: windowState.size.width, height: windowState.size.height }}
            position={windowState.isMaximized ? { x: 0, y: 0 } : { x: windowState.position.x, y: windowState.position.y }}
            onDragStop={handleDragStop}
            onResizeStop={handleResizeStop}
            minWidth={300}
            minHeight={200}
            bounds="parent"
            disableDragging={windowState.isMaximized}
            enableResizing={!windowState.isMaximized}
            dragHandleClassName="handle"
            style={{ zIndex: windowState.zIndex }}
            onMouseDown={() => focusApp(id)}
        >
            <Window style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <WindowHeader className={windowState.isMaximized ? '' : 'handle'} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeWindowId === id ? '#000080' : '#808080' }}>
                    <span>{appName}</span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                        <Button onClick={(e) => { e.stopPropagation(); toggleMaximizeApp(id); }} style={{ minWidth: "24px", minHeight: "24px" }}>
                            <span style={{ fontWeight: 'bold' }}>{windowState.isMaximized ? '❐' : '□'}</span>
                        </Button>
                        <Button onClick={(e) => { e.stopPropagation(); closeApp(id); }} style={{ minWidth: "24px", minHeight: "24px" }}>
                            <span style={{ fontWeight: 'bold', transform: 'translateY(-1px)' }}>x</span>
                        </Button>
                    </div>
                </WindowHeader>
                <WindowContent style={{ flex: 1, padding: '0.25rem', overflow: 'hidden' }}>
                    {children}
                </WindowContent>
            </Window>
        </Rnd>
    );
}
