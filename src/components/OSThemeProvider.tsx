'use client';

import React from 'react';
import { ThemeProvider } from 'styled-components';
import original from 'react95/dist/themes/original';
import StyledComponentsRegistry from '@/lib/registry';
// React95 global styles
import { createGlobalStyle } from 'styled-components';

const GlobalStyles = createGlobalStyle`
  /* Override basic styles for the body to match Windows 95 */
  body {
    background-color: #008080;
    margin: 0;
    overflow: hidden; /* Prevent scrolling on desktop OS */
    font-size: 14px;
  }
  
  * {
    box-sizing: border-box;
  }
`;

export default function OSThemeProvider({ children }: { children: React.ReactNode }) {
    return (
        <StyledComponentsRegistry>
            <ThemeProvider theme={original}>
                <GlobalStyles />
                {children}
            </ThemeProvider>
        </StyledComponentsRegistry>
    );
}
