'use client';

import React, { useState } from 'react';
import { ScrollView, TextInput, Button, Select, Table, TableHead, TableRow, TableHeadCell, TableBody, TableDataCell, ProgressBar, Anchor } from 'react95';
import { useAuthStore } from '@/store/useAuthStore';
import { useDesktopStore } from '@/store/useDesktopStore';

interface JobResult {
  company: string;
  role: string;
  location: string;
  link: string;
}

export default function JobSearchApp() {
  const { user } = useAuthStore();
  const { openApp } = useDesktopStore();
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<JobResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [level, setLevel] = useState('entry');

  const handleSearch = async () => {
    if (!role.trim()) return;

    setLoading(true);
    setResults([]);
    setError('');
    setProgress(10);

    try {
      const progressInterval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 5 : p));
      }, 500);

      const response = await fetch('/api/job-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, location, level })
      });

      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search jobs');
      }

      setResults(data.jobs || []);
      if (!data.jobs || data.jobs.length === 0) {
        setError('No jobs found for this search. Try different keywords.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while searching.');
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  if (!user) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '10px', textAlign: 'center' }}>
        <h2>Authentication Required</h2>
        <p>AI Job Search connects to proprietary databases and requires network authentication.</p>
        <Button size="lg" onClick={() => openApp('login-app', 'Network Connectivity')}>Open Network Login</Button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '10px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
                <TextInput 
                  placeholder="Job Role (e.g. Frontend)" 
                  fullWidth 
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
                <TextInput 
                  placeholder="Location" 
                  fullWidth 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
                <Select
                    options={[{ value: 'entry', label: 'Entry Level' }, { value: 'mid', label: 'Mid Level' }, { value: 'senior', label: 'Senior Level' }, { value: 'Any', label: 'Any Level' }]}
                    width={150}
                    value={level}
                    onChange={(val) => setLevel(val.value)}
                />
                <Button onClick={handleSearch} disabled={loading || !role.trim()}>Search</Button>
            </div>

            {loading && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '12px' }}>Connecting to Firecrawl Extranet...</span>
                    <ProgressBar value={progress} style={{ flex: 1 }} />
                </div>
            )}

            <ScrollView style={{ flex: 1, backgroundColor: 'white' }}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableHeadCell>Company</TableHeadCell>
                            <TableHeadCell>Role</TableHeadCell>
                            <TableHeadCell>Location</TableHeadCell>
                            <TableHeadCell>Action</TableHeadCell>
                        </TableRow>
                    </TableHead>
        <TableBody>
            {results.map((job, idx) => (
                <TableRow key={idx}>
                    <TableDataCell>{job.company}</TableDataCell>
                    <TableDataCell>{job.role}</TableDataCell>
                    <TableDataCell>{job.location}</TableDataCell>
                    <TableDataCell>
                      <Anchor href={job.link} target="_blank" rel="noopener noreferrer">
                        <Button size="sm">Apply</Button>
                      </Anchor>
                    </TableDataCell>
                </TableRow>
            ))}
            {results.length === 0 && !loading && (
                <TableRow>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: error ? '#cc0000' : '#888' }}>
                        {error || 'No results. Enter a job role and click Search.'}
                    </td>
                </TableRow>
            )}
        </TableBody>
                </Table>
            </ScrollView>
        </div>
    );
}
