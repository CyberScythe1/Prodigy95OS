'use client';

import { create } from 'zustand';

export interface Position {
    x: number;
    y: number;
}

export interface Size {
    width: number;
    height: number;
}

export interface AppWindow {
    id: string;
    appName: string;
    isOpen: boolean;
    isMinimized: boolean;
    isMaximized: boolean;
    position: Position;
    size: Size;
    zIndex: number;
}

interface DesktopState {
    windows: AppWindow[];
    activeWindowId: string | null;
    startMenuOpen: boolean;
    nextZIndex: number;

    // Actions
    openApp: (appId: string, appName: string, defaultSize?: Partial<Size>) => void;
    closeApp: (appId: string) => void;
    minimizeApp: (appId: string) => void;
    toggleMaximizeApp: (appId: string) => void;
    focusApp: (appId: string) => void;
    updateWindowPosition: (appId: string, position: Position) => void;
    updateWindowSize: (appId: string, size: Size) => void;
    toggleStartMenu: () => void;
    closeStartMenu: () => void;
}

const DEFAULT_WINDOW_SIZE = { width: 600, height: 450 };

export const useDesktopStore = create<DesktopState>((set, get) => ({
    windows: [],
    activeWindowId: null,
    startMenuOpen: false,
    nextZIndex: 10,

    openApp: (appId, appName, defaultSize) => set((state) => {
        const existingWindow = state.windows.find(w => w.id === appId);

        // If it's already open, just focus it and un-minimize it
        if (existingWindow) {
            if (existingWindow.isMinimized) {
                get().minimizeApp(appId); // this will un-minimize since we toggle the state
                // wait, we should just set it explicitly
            }
            get().focusApp(appId);
            return { startMenuOpen: false };
        }

        // Determine position (cascade slightly based on number of windows)
        const offset = (state.windows.length % 5) * 40;

        const newWindow: AppWindow = {
            id: appId,
            appName,
            isOpen: true,
            isMinimized: false,
            isMaximized: false,
            position: { x: 100 + offset, y: 100 + offset },
            size: { ...DEFAULT_WINDOW_SIZE, ...defaultSize },
            zIndex: state.nextZIndex
        };

        return {
            windows: [...state.windows, newWindow],
            activeWindowId: appId,
            nextZIndex: state.nextZIndex + 1,
            startMenuOpen: false,
        };
    }),

    closeApp: (appId) => set((state) => ({
        windows: state.windows.filter(w => w.id !== appId),
        activeWindowId: state.activeWindowId === appId
            ? (state.windows.length > 1 ? state.windows[state.windows.length - 2].id : null)
            : state.activeWindowId
    })),

    minimizeApp: (appId) => set((state) => {
        const windows = state.windows.map(w =>
            w.id === appId ? { ...w, isMinimized: !w.isMinimized } : w
        );
        // If we just minimized the active window, remove focus
        const justMinimized = windows.find(w => w.id === appId)?.isMinimized;
        return {
            windows,
            activeWindowId: (justMinimized && state.activeWindowId === appId) ? null : state.activeWindowId
        };
    }),

    toggleMaximizeApp: (appId) => set((state) => ({
        windows: state.windows.map(w =>
            w.id === appId ? { ...w, isMaximized: !w.isMaximized } : w
        )
    })),

    focusApp: (appId) => set((state) => ({
        windows: state.windows.map(w =>
            w.id === appId ? { ...w, zIndex: state.nextZIndex, isMinimized: false } : w
        ),
        activeWindowId: appId,
        nextZIndex: state.nextZIndex + 1,
        startMenuOpen: false,
    })),

    updateWindowPosition: (appId, position) => set((state) => ({
        windows: state.windows.map(w => w.id === appId ? { ...w, position } : w)
    })),

    updateWindowSize: (appId, size) => set((state) => ({
        windows: state.windows.map(w => w.id === appId ? { ...w, size } : w)
    })),

    toggleStartMenu: () => set((state) => ({ startMenuOpen: !state.startMenuOpen })),

    closeStartMenu: () => set({ startMenuOpen: false }),
}));
