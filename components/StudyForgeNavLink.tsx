'use client';

import Link from 'next/link';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';

interface StudyForgeNavLinkProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Reusable StudyForge navigation link with status badge
 * Shows pending idle XP or current level
 */
export default function StudyForgeNavLink({ className, showLabel = true }: StudyForgeNavLinkProps) {
  const { state } = useStudyForge();

  // Determine badge content and color
  const hasPendingXP = state && state.pendingIdleXP > 0;
  const badgeContent = hasPendingXP
    ? `${Math.floor(state.pendingIdleXP)}`
    : state?.level
    ? `Lv${state.level}`
    : null;

  const badgeColor = hasPendingXP
    ? 'bg-terracotta text-cream'
    : 'bg-sage-green/20 text-sage-green border border-sage-green/30';

  return (
    <Link
      href="/studyforge"
      className={
        className ||
        'inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-charcoal hover:text-sage-green rounded-[--radius-default] hover:bg-sage-green/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-green/50 min-h-[40px] touch-manipulation relative'
      }
    >
      <span className="text-base">⚡</span>
      {showLabel && <span className="hidden sm:inline">StudyForge</span>}
      {badgeContent && (
        <span
          className={`absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold rounded-full ${badgeColor} animate-pulse-glow`}
        >
          {badgeContent}
        </span>
      )}
    </Link>
  );
}
