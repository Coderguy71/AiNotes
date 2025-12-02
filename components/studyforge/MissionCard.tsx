'use client';

import { useState } from 'react';
import { claimMission } from '@/lib/studyForge';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';
import type { DailyMission } from '@/lib/db';

interface MissionCardProps {
  mission: DailyMission;
}

export function MissionCard({ mission }: MissionCardProps) {
  const { refreshState } = useStudyForge();
  const [isClaiming, setIsClaiming] = useState(false);

  const progress = Math.min(mission.progress / mission.target, 1);
  const isComplete = mission.progress >= mission.target;
  const isClaimed = mission.claimed;

  const handleClaim = async () => {
    if (isClaiming || isClaimed || !isComplete) return;

    try {
      setIsClaiming(true);
      await claimMission(mission.id);
      await refreshState();
    } catch (error) {
      console.error('Failed to claim mission:', error);
    } finally {
      setIsClaiming(false);
    }
  };

  const getMissionIcon = () => {
    switch (mission.id) {
      case 'create_notes':
        return '📝';
      case 'generate_flashcards':
        return '🎴';
      case 'review_flashcards':
        return '👀';
      case 'earn_xp':
        return '⭐';
      case 'daily_login':
        return '📅';
      case 'study_streak':
        return '🔥';
      default:
        return '✨';
    }
  };

  return (
    <div
      className={`
        relative
        bg-cream rounded-lg p-5
        border-2
        transition-all duration-200
        ${isClaimed ? 'border-sage-green opacity-75' : 'border-almond-silk hover:border-dusty-mauve hover:shadow-md'}
      `}
    >
      {/* Claimed badge */}
      {isClaimed && (
        <div className="absolute top-3 right-3 bg-sage-green text-cream text-xs font-semibold px-2 py-1 rounded-full">
          ✓ Claimed
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-3xl" aria-hidden="true">
            {getMissionIcon()}
          </span>
          <div className="flex-1">
            <h3 className="font-serif text-base text-charcoal">
              {mission.title}
            </h3>
            <p className="text-sm text-dim-grey mt-1">
              {mission.description}
            </p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-dim-grey">
              {mission.progress} / {mission.target}
            </span>
            <span className="text-dusty-mauve font-semibold">
              {mission.reward} XP
            </span>
          </div>
          
          <div className="w-full h-2 bg-almond-silk/30 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sage-green to-soft-pink transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        {/* Claim button */}
        <button
          onClick={handleClaim}
          disabled={!isComplete || isClaimed || isClaiming}
          className={`
            w-full px-4 py-2 rounded-lg font-semibold text-sm
            transition-all duration-200
            ${
              isClaimed
                ? 'bg-sage-green/20 text-sage-green cursor-not-allowed'
                : isComplete
                ? 'bg-gradient-to-r from-terracotta to-dusty-mauve text-cream hover:shadow-md hover:scale-[1.02]'
                : 'bg-dim-grey/20 text-dim-grey cursor-not-allowed'
            }
          `}
        >
          {isClaiming ? (
            <span className="animate-breathing-spinner">⏳</span>
          ) : isClaimed ? (
            '✓ Claimed'
          ) : isComplete ? (
            `Claim ${mission.reward} XP`
          ) : (
            'In Progress'
          )}
        </button>
      </div>
    </div>
  );
}
