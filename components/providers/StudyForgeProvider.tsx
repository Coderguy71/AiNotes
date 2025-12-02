'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  initStudyForge,
  subscribeStudyForge,
  getStudyForgeState,
  type StudyForgeEvent,
} from '@/lib/studyForge';
import type { StudyForgeRecord } from '@/lib/db';

interface StudyForgeContextType {
  state: StudyForgeRecord | null;
  isLoading: boolean;
  error: string | null;
  refreshState: () => Promise<void>;
  events: StudyForgeEvent[];
}

const StudyForgeContext = createContext<StudyForgeContextType | null>(null);

export function StudyForgeProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<StudyForgeRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<StudyForgeEvent[]>([]);

  const refreshState = useCallback(async () => {
    try {
      const currentState = getStudyForgeState();
      if (currentState) {
        setState(currentState);
      }
    } catch (err) {
      console.error('StudyForge: Failed to refresh state:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh state');
    }
  }, []);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const initialState = await initStudyForge();
        if (mounted) {
          setState(initialState);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('StudyForge: Initialization error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to initialize StudyForge');
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;

    // Subscribe to StudyForge events
    const unsubscribe = subscribeStudyForge((event) => {
      // Add event to event stream (keep last 20)
      setEvents((prev) => [...prev, event].slice(-20));

      // Refresh state on any event
      refreshState();
    });

    return unsubscribe;
  }, [refreshState]);

  return (
    <StudyForgeContext.Provider value={{ state, isLoading, error, refreshState, events }}>
      {children}
    </StudyForgeContext.Provider>
  );
}

export function useStudyForge() {
  const context = useContext(StudyForgeContext);
  if (!context) {
    throw new Error('useStudyForge must be used within StudyForgeProvider');
  }
  return context;
}
