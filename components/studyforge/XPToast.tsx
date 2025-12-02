'use client';

/* eslint-disable react-hooks/set-state-in-effect */
// This file uses setState in effects for event bus subscription pattern (external event handling)

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';
import type { StudyForgeEvent } from '@/lib/studyForge';

interface Toast {
  id: string;
  event: StudyForgeEvent;
  timestamp: number;
}

export function XPToastHost() {
  const { events, state } = useStudyForge();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastEventIndexRef = useRef(0);

  // Track the last processed event to avoid duplicates
  useEffect(() => {
    if (events.length === 0 || events.length <= lastEventIndexRef.current) return;
    if (!state?.settings.notificationsEnabled) return;

    const latestEvent = events[events.length - 1];
    lastEventIndexRef.current = events.length;
    
    // Only show toasts for XP events and level ups
    if (latestEvent.type === 'xpAwarded' || latestEvent.type === 'levelUp') {
      const newToast: Toast = {
        id: `${Date.now()}-${Math.random()}`,
        event: latestEvent,
        timestamp: Date.now(),
      };

      // Add new toast
      setToasts((prevToasts) => [...prevToasts, newToast]);

      // Auto-remove after 3 seconds
      const timeoutId = setTimeout(() => {
        setToasts((prevToasts) => prevToasts.filter((t) => t.id !== newToast.id));
      }, 3000);

      return () => clearTimeout(timeoutId);
    }
  }, [events, state?.settings.notificationsEnabled]);

  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast, index) => (
        <XPToastItem
          key={toast.id}
          event={toast.event}
          style={{ animationDelay: `${index * 100}ms` }}
        />
      ))}
    </div>,
    document.body
  );
}

interface XPToastItemProps {
  event: StudyForgeEvent;
  style?: React.CSSProperties;
}

function XPToastItem({ event, style }: XPToastItemProps) {
  const getToastContent = () => {
    switch (event.type) {
      case 'xpAwarded':
        return {
          icon: '✨',
          text: `+${event.effectiveXP} XP`,
          subtext: event.reason.replace(/_/g, ' '),
          color: 'from-sage-green to-soft-pink',
        };
      case 'levelUp':
        return {
          icon: '🎉',
          text: `Level ${event.newLevel}!`,
          subtext: 'Level up!',
          color: 'from-terracotta to-dusty-mauve',
        };
      default:
        return null;
    }
  };

  const content = getToastContent();
  if (!content) return null;

  return (
    <div
      className="animate-toast-slide-in pointer-events-auto"
      style={style}
    >
      <div
        className={`
          bg-gradient-to-r ${content.color}
          text-cream
          px-4 py-3
          rounded-lg
          shadow-lg
          flex items-center gap-3
          min-w-[200px]
          backdrop-blur-sm
        `}
      >
        <span className="text-2xl animate-pulse-glow">{content.icon}</span>
        <div className="flex flex-col">
          <span className="font-semibold text-base">{content.text}</span>
          <span className="text-xs opacity-90 capitalize">{content.subtext}</span>
        </div>
      </div>
    </div>
  );
}
