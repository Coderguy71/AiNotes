'use client';

import { useState } from 'react';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';
import { addPassiveXPSinceLastActive, updateSettings } from '@/lib/studyForge';

export function StudyForgeHeader() {
  const { state, refreshState } = useStudyForge();
  const [isCollecting, setIsCollecting] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  if (!state) return null;

  const progressPercent = state.xpProgress * 100;
  const hasIdleXP = state.pendingIdleXP > 0;

  const handleCollectIdleXP = async () => {
    if (isCollecting || !hasIdleXP) return;

    try {
      setIsCollecting(true);
      await addPassiveXPSinceLastActive();
      await refreshState();
    } catch (error) {
      console.error('Failed to collect idle XP:', error);
    } finally {
      setIsCollecting(false);
    }
  };

  const handleToggleSetting = async (key: string, value: boolean) => {
    try {
      await updateSettings({ ...state.settings, [key]: value });
      await refreshState();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  return (
    <>
      <div className="bg-cream rounded-xl p-6 border-2 border-almond-silk shadow-lg">
        <div className="space-y-6">
          {/* Top row: Level, XP, and Actions */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Level badge */}
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-terracotta to-dusty-mauve text-cream rounded-full w-16 h-16 flex items-center justify-center shadow-md">
                <div className="text-center">
                  <div className="text-xs font-semibold opacity-90">Level</div>
                  <div className="text-xl font-bold">{state.level}</div>
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-serif text-charcoal">
                  StudyForge
                </h1>
                <p className="text-sm text-dim-grey">
                  {state.totalXP.toLocaleString()} Total XP
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Streak badge */}
              {state.dailyStreak > 0 && (
                <div className="bg-terracotta/10 text-terracotta px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2">
                  <span>🔥</span>
                  <span>{state.dailyStreak} day streak</span>
                </div>
              )}

              {/* Idle XP indicator */}
              {hasIdleXP && (
                <button
                  onClick={handleCollectIdleXP}
                  disabled={isCollecting}
                  className="bg-gradient-to-r from-sage-green to-soft-pink text-cream px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center gap-2"
                >
                  {isCollecting ? (
                    <span className="animate-breathing-spinner">⏳</span>
                  ) : (
                    <>
                      <span>✨</span>
                      <span className="hidden sm:inline">Collect {Math.floor(state.pendingIdleXP)} XP</span>
                      <span className="sm:hidden">{Math.floor(state.pendingIdleXP)} XP</span>
                    </>
                  )}
                </button>
              )}

              {/* Quick Actions button */}
              <button
                onClick={() => setShowQuickActions(true)}
                className="bg-almond-silk text-charcoal px-4 py-2 rounded-lg text-sm font-semibold hover:bg-dusty-mauve hover:text-cream transition-all duration-200 flex items-center gap-2"
                aria-label="Quick Actions"
              >
                <span>⚙️</span>
                <span className="hidden sm:inline">Settings</span>
              </button>
            </div>
          </div>

          {/* XP progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-dim-grey">
                Level {state.level} Progress
              </span>
              <span className="text-charcoal font-semibold">
                {state.availableXP.toLocaleString()} / {state.xpForNext.toLocaleString()} XP
              </span>
            </div>
            
            <div className="w-full h-4 bg-almond-silk/30 rounded-full overflow-hidden shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-sage-green via-dusty-mauve to-terracotta transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Passive XP indicator */}
            {state.passiveXPPerSec > 0 && (
              <p className="text-xs text-dim-grey text-right">
                +{state.passiveXPPerSec.toFixed(1)} XP/sec passive generation
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Modal */}
      {showQuickActions && (
        <>
          <div
            className="fixed inset-0 bg-charcoal/60 backdrop-blur-sm z-40"
            onClick={() => setShowQuickActions(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="bg-cream rounded-xl shadow-xl p-6 max-w-md w-full pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-serif text-charcoal mb-6">Settings</h2>
              
              <div className="space-y-4">
                {/* Sound effects toggle */}
                <div className="flex items-center justify-between p-4 bg-almond-silk/20 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-charcoal">Sound Effects</h3>
                    <p className="text-xs text-dim-grey">Audio feedback for XP gains</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('soundEnabled', !state.settings.soundEnabled)}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${state.settings.soundEnabled ? 'bg-sage-green' : 'bg-dim-grey/30'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 w-4 h-4 bg-cream rounded-full shadow-md transition-transform duration-200
                        ${state.settings.soundEnabled ? 'translate-x-7' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>

                {/* Notifications toggle */}
                <div className="flex items-center justify-between p-4 bg-almond-silk/20 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-charcoal">Notifications</h3>
                    <p className="text-xs text-dim-grey">Show XP toasts and modals</p>
                  </div>
                  <button
                    onClick={() => handleToggleSetting('notificationsEnabled', !state.settings.notificationsEnabled)}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${state.settings.notificationsEnabled ? 'bg-sage-green' : 'bg-dim-grey/30'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 w-4 h-4 bg-cream rounded-full shadow-md transition-transform duration-200
                        ${state.settings.notificationsEnabled ? 'translate-x-7' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>

                {/* Confetti toggle */}
                <div className="flex items-center justify-between p-4 bg-almond-silk/20 rounded-lg">
                  <div>
                    <h3 className="font-semibold text-charcoal">Confetti Effects</h3>
                    <p className="text-xs text-dim-grey">Celebration animations</p>
                  </div>
                  <button
                    onClick={() => {
                      const settings = state.settings as unknown as Record<string, unknown>;
                      const enableConfetti = settings.enableConfetti !== false;
                      handleToggleSetting('enableConfetti', !enableConfetti);
                    }}
                    className={`
                      relative w-12 h-6 rounded-full transition-colors duration-200
                      ${(state.settings as unknown as Record<string, unknown>).enableConfetti !== false ? 'bg-sage-green' : 'bg-dim-grey/30'}
                    `}
                  >
                    <div
                      className={`
                        absolute top-1 w-4 h-4 bg-cream rounded-full shadow-md transition-transform duration-200
                        ${(state.settings as unknown as Record<string, unknown>).enableConfetti !== false ? 'translate-x-7' : 'translate-x-1'}
                      `}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowQuickActions(false)}
                className="mt-6 w-full px-4 py-3 bg-gradient-to-r from-terracotta to-dusty-mauve text-cream rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
