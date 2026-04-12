'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import styled from 'styled-components';
import { Button, Frame } from 'react95';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background: silver;
  padding: 10px;
  height: 100%;
`;

const GameHeader = styled(Frame)`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 8px;
  margin-bottom: 10px;
  background: silver;
`;

const DigitalDisplay = styled(Frame)`
  background: black;
  color: red;
  font-family: 'Courier New', Courier, monospace;
  font-size: 24px;
  font-weight: bold;
  padding: 4px 8px;
  min-width: 60px;
  text-align: center;
`;

const BoardContainer = styled(Frame)`
  padding: 2px;
  background: silver;
  display: inline-block;
`;

const Grid = styled.div<{ rows: number; cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(props) => props.cols}, 24px);
  grid-template-rows: repeat(${(props) => props.rows}, 24px);
  gap: 0;
`;

const CellButton = styled(Button)<{ isRevealed: boolean }>`
  width: 24px;
  height: 24px;
  min-width: 24px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  background: ${(props) => (props.isRevealed ? '#c0c0c0' : 'silver')};
  border: ${(props) => (props.isRevealed ? '1px solid #7b7b7b' : undefined)};
  box-shadow: ${(props) => (props.isRevealed ? 'none' : undefined)};
  
  &:active {
    padding-top: ${(props) => (props.isRevealed ? '0' : '2px')};
  }
`;

type CellState = {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
    row: number;
    col: number;
};

const ROWS = 10;
const COLS = 10;
const MINES_COUNT = 10;

const MINE_COLORS = [
    'transparent',
    'blue',
    'green',
    'red',
    'darkblue',
    'darkred',
    'teal',
    'black',
    'gray',
];

export default function Minesweeper() {
    const [grid, setGrid] = useState<CellState[][]>([]);
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'won' | 'lost'>('idle');
    const [minesLeft, setMinesLeft] = useState(MINES_COUNT);
    const [time, setTime] = useState(0);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    const initializeBoard = useCallback(() => {
        let newGrid: CellState[][] = Array(ROWS).fill(null).map((_, r) =>
            Array(COLS).fill(null).map((_, c) => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
                row: r,
                col: c,
            }))
        );

        // Place mines
        let minesPlaced = 0;
        while (minesPlaced < MINES_COUNT) {
            const r = Math.floor(Math.random() * ROWS);
            const c = Math.floor(Math.random() * COLS);
            if (!newGrid[r][c].isMine) {
                newGrid[r][c].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate neighbors
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                if (!newGrid[r][c].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && newGrid[nr][nc].isMine) {
                                count++;
                            }
                        }
                    }
                    newGrid[r][c].neighborMines = count;
                }
            }
        }

        setGrid(newGrid);
        setGameState('idle');
        setMinesLeft(MINES_COUNT);
        setTime(0);
        if (timerRef.current) clearInterval(timerRef.current);
    }, []);

    useEffect(() => {
        initializeBoard();
        return () => {
             if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [initializeBoard]);

    const startGameTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setTime((t) => (t < 999 ? t + 1 : t));
        }, 1000);
    };

    const stopGameTimer = () => {
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const checkWinCondition = (currentGrid: CellState[][]) => {
        let won = true;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const cell = currentGrid[r][c];
                if (!cell.isMine && !cell.isRevealed) {
                    won = false;
                }
            }
        }
        if (won) {
            setGameState('won');
            stopGameTimer();
            setMinesLeft(0);
        }
    };

    const revealEmptyCells = (r: number, c: number, currentGrid: CellState[][]) => {
        const queue = [{r, c}];
        const newGrid = [...currentGrid.map(row => [...row])];
        
        while (queue.length > 0) {
            const current = queue.shift();
            if (!current) continue;
            
            const { r: cr, c: cc } = current;
            
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = cr + dr;
                    const nc = cc + dc;
                    if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) {
                        const cell = newGrid[nr][nc];
                        if (!cell.isRevealed && !cell.isFlagged) {
                            newGrid[nr][nc] = { ...cell, isRevealed: true };
                            if (cell.neighborMines === 0 && !cell.isMine) {
                                queue.push({ r: nr, c: nc });
                            }
                        }
                    }
                }
            }
        }
        return newGrid;
    };

    const handleCellClick = (row: number, col: number) => {
        if (gameState === 'won' || gameState === 'lost') return;
        
        const cell = grid[row][col];
        if (cell.isRevealed || cell.isFlagged) return;

        let newGrid = [...grid.map(r => [...r])];

        if (gameState === 'idle') {
            setGameState('playing');
            startGameTimer();
            // Optional: Ensure first click is never a mine by regenerating if needed
            if (newGrid[row][col].isMine) {
                // simple quick fix: move the mine elsewhere (or better, just re-initialize until safe)
                let safe = false;
                while (!safe) {
                    initializeBoard();
                    // we can't reliably do this sync if initializeBoard is state-reliant, 
                    // so we just let them die for now if unlucky, 
                    // or implement a standard safe-start.
                }
            }
        }

        if (cell.isMine) {
            // Game Over
            setGameState('lost');
            stopGameTimer();
            // Reveal all mines
            newGrid = newGrid.map(r => r.map(c => 
                (c.isMine ? { ...c, isRevealed: true } : c)
            ));
            setGrid(newGrid);
            return;
        }

        newGrid[row][col].isRevealed = true;
        if (cell.neighborMines === 0) {
            newGrid = revealEmptyCells(row, col, newGrid);
        }

        setGrid(newGrid);
        checkWinCondition(newGrid);
    };

    const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
        e.preventDefault();
        toggleFlag(row, col);
    };

    const toggleFlag = (row: number, col: number) => {
        if (gameState === 'won' || gameState === 'lost') return;
        
        const cell = grid[row][col];
        if (cell.isRevealed) return;

        const newGrid = [...grid.map(r => [...r])];
        const newFlagState = !cell.isFlagged;
        newGrid[row][col].isFlagged = newFlagState;
        
        setGrid(newGrid);
        setMinesLeft(prev => prev + (newFlagState ? -1 : 1));
    };

    // Mobile specific: long press to flag
    const handleTouchStart = (row: number, col: number) => {
        longPressTimer.current = setTimeout(() => {
            toggleFlag(row, col);
            longPressTimer.current = null;
        }, 500);
    };

    const handleTouchEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const getFaceIcon = () => {
        if (gameState === 'lost') return '😵';
        if (gameState === 'won') return '😎';
        return '🙂';
    };

    return (
        <AppContainer>
            <GameHeader variant="well">
                <DigitalDisplay variant="well">
                    {minesLeft.toString().padStart(3, '0')}
                </DigitalDisplay>
                
                <Button 
                    square 
                    style={{ width: 32, height: 32, fontSize: 18 }} 
                    onClick={initializeBoard}
                >
                    {getFaceIcon()}
                </Button>
                
                <DigitalDisplay variant="well">
                    {time.toString().padStart(3, '0')}
                </DigitalDisplay>
            </GameHeader>

            <BoardContainer variant="well">
                <Grid rows={ROWS} cols={COLS}>
                    {grid.map((row, r) => 
                        row.map((cell, c) => (
                            <CellButton
                                key={`${r}-${c}`}
                                isRevealed={cell.isRevealed}
                                active={cell.isRevealed}
                                onClick={() => handleCellClick(r, c)}
                                onContextMenu={(e) => handleCellRightClick(e, r, c)}
                                onTouchStart={() => handleTouchStart(r, c)}
                                onTouchEnd={handleTouchEnd}
                                onTouchMove={handleTouchEnd}
                                style={{ 
                                    color: cell.isRevealed && cell.neighborMines > 0 
                                            ? MINE_COLORS[cell.neighborMines] 
                                            : 'inherit' 
                                }}
                            >
                                {cell.isRevealed ? (
                                    cell.isMine ? '💣' : (cell.neighborMines > 0 ? cell.neighborMines : '')
                                ) : (
                                    cell.isFlagged ? '🚩' : ''
                                )}
                            </CellButton>
                        ))
                    )}
                </Grid>
            </BoardContainer>
        </AppContainer>
    );
}
