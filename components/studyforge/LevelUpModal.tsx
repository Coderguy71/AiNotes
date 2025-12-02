'use client';

import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';

// Generate confetti positions at module level to avoid re-renders
const confettiData = Array.from({ length: 30 }).map(() => ({
  left: Math.random() * 100,
  top: Math.random() * 100,
  colorIndex: Math.floor(Math.random() * 5),
  delay: Math.random() * 0.5,
  duration: 1 + Math.random(),
}));

const colors = [
  'var(--sage-green)',
  'var(--terracotta)',
  'var(--soft-pink)',
  'var(--dusty-mauve)',
  'var(--almond-silk)',
];

function ConfettiEffect() {
  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      {confettiData.map((confetti, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 rounded-full animate-confetti-pop"
          style={{
            left: `${confetti.left}%`,
            top: `${confetti.top}%`,
            background: colors[confetti.colorIndex],
            animationDelay: `${confetti.delay}s`,
            animationDuration: `${confetti.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

export function LevelUpModal() {
  const { events, state } = useStudyForge();
  const [showModal, setShowModal] = useState(false);
  const [levelUpInfo, setLevelUpInfo] = useState<{ level: number; totalXP: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const lastEventIndexRef = useRef(0);

  // Listen for level up events
  useEffect(() => {
    if (events.length === 0 || events.length <= lastEventIndexRef.current) return;
    if (!state?.settings.notificationsEnabled) return;

    const latestEvent = events[events.length - 1];
    lastEventIndexRef.current = events.length;
    
    if (latestEvent.type === 'levelUp') {
      setLevelUpInfo({ level: latestEvent.newLevel, totalXP: latestEvent.totalXP });
      setShowModal(true);

      // Show confetti if enabled (check for enableConfetti in settings, default true)
      const settings = state.settings as unknown as Record<string, unknown>;
      const enableConfetti = settings.enableConfetti !== false;
      if (enableConfetti) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }

      // Auto-close after 5 seconds
      const timeoutId = setTimeout(() => {
        setShowModal(false);
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, state?.settings.notificationsEnabled]);

  if (typeof window === 'undefined') return null;
  if (!showModal || !levelUpInfo) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-50 animate-fade-in"
        onClick={() => setShowModal(false)}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-cream rounded-xl shadow-xl p-8 max-w-md w-full animate-fade-in-scale pointer-events-auto relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-sage-green/10 via-transparent to-dusty-mauve/10 pointer-events-none" />

          {/* Content */}
          <div className="relative z-10 text-center space-y-4">
            <div className="text-6xl mb-4 animate-celebratory-pulse">🎉</div>
            <h2 className="text-3xl font-serif text-charcoal">
              Level Up!
            </h2>
            <p className="text-5xl font-bold bg-gradient-to-r from-terracotta to-dusty-mauve bg-clip-text text-transparent">
              Level {levelUpInfo.level}
            </p>
            <p className="text-dim-grey text-sm">
              Total XP: {levelUpInfo.totalXP.toLocaleString()}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="mt-6 px-6 py-3 bg-gradient-to-r from-terracotta to-dusty-mauve text-cream rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              Awesome!
            </button>
          </div>
        </div>
      </div>

      {/* CSS Confetti */}
      {showConfetti && <ConfettiEffect />}
    </>,
    document.body
  );
}
