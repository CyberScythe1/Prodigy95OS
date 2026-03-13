'use client';

import React from 'react';
import styled from 'styled-components';
import { useDesktopStore } from '@/store/useDesktopStore';

const IconContainer = styled.div<{ active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 75px;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const IconImage = styled.div<{ bgColor: string }>`
  width: 32px;
  height: 32px;
  background-color: ${props => props.bgColor};
  margin-bottom: 4px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px solid white;
  border-radius: 2px;
  box-shadow: 2px 2px 0px 0px rgba(0,0,0,0.5);
  font-size: 1.2rem;
`;

const IconText = styled.div<{ active?: boolean }>`
  color: white;
  text-align: center;
  font-size: 11px;
  text-shadow: 1px 1px 0px black;
  background-color: ${props => props.active ? '#000080' : 'transparent'};
  padding: 0 2px;
  ${props => props.active && 'border: 1px dotted white;'}
`;

export default function DesktopIcon({
    id,
    name,
    emoji,
    color,
}: {
    id: string;
    name: string;
    emoji: string;
    color: string;
}) {
    const { openApp } = useDesktopStore();
    const [active, setActive] = React.useState(false);

    const handleDoubleClick = () => {
        openApp(id, name);
        setActive(false);
    };

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation(); // don't trigger desktop click which clears active or closes menu
        setActive(true);
    };

    // Listen to body clicks to clear active state
    React.useEffect(() => {
        const clearActive = () => setActive(false);
        document.addEventListener('click', clearActive);
        return () => document.removeEventListener('click', clearActive);
    }, []);

    return (
        <IconContainer onClick={handleClick} onDoubleClick={handleDoubleClick}>
            <IconImage bgColor={color}>{emoji}</IconImage>
            <IconText active={active}>{name}</IconText>
        </IconContainer>
    );
}
