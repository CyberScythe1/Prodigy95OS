'use client';

import React, { useState } from 'react';
import { Button, TextInput, Window, WindowHeader, WindowContent, Anchor } from 'react95';
import styled from 'styled-components';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { useDesktopStore } from '@/store/useDesktopStore';
import { useAuthStore } from '@/store/useAuthStore';

const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 16px;
  padding: 10px;
`;

export default function LoginApp() {
  const { closeApp } = useDesktopStore();
  const { user } = useAuthStore();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithPopup(auth, googleProvider);
      // Login success, close the login window
      closeApp('login-app');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in. Check console and API keys.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await auth.signOut();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (user) {
    return (
      <LoginContainer>
        <img src={user.photoURL || '/icons/default-avatar.png'} alt="avatar" width={48} height={48} style={{ borderRadius: '50%' }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
        <h3>Welcome, {user.displayName}</h3>
        <p>Logged in as: <Anchor href={`mailto:${user.email}`}>{user.email}</Anchor></p>
        <Button onClick={handleLogout} disabled={loading} style={{ marginTop: '10px' }}>
          <strong>Logout (Disconnect)</strong>
        </Button>
      </LoginContainer>
    );
  }

  return (
    <LoginContainer>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/key.png" alt="security" width={64} height={64} style={{ marginBottom: 10 }} onError={(e) => { e.currentTarget.style.display = 'none' }} />
      <h2>System Security</h2>
      <p style={{ maxWidth: '280px', marginBottom: '10px' }}>
        A valid network credential is required to access Notes and Job Search applications.
      </p>
      
      {error && <div style={{ color: 'red', fontSize: '12px', fontWeight: 'bold' }}>{error}</div>}

      <Button 
        onClick={handleGoogleLogin} 
        disabled={loading}
        size="lg" 
        style={{ fontWeight: 'bold', width: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ marginRight: '8px' }}>G</span> Sign in with Google
      </Button>
      <div style={{ fontSize: '11px', marginTop: '10px', color: '#666' }}>
        Authenticating via Firebase Protocols
      </div>
    </LoginContainer>
  );
}
