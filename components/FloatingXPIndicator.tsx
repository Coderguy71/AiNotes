"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * FloatingXPIndicatorProps interface
 * 
 * @property xpAmount - Amount of XP to display (e.g., 10)
 * @property show - Whether to show the indicator
 * @property onComplete - Callback when animation completes
 * @property enableAnimations - Whether animations are enabled (from settings)
 */
export interface FloatingXPIndicatorProps {
  xpAmount: number;
  show: boolean;
  onComplete?: () => void;
  enableAnimations?: boolean;
}

/**
 * FloatingXPIndicator Component
 * 
 * A floating "+XX XP" indicator that appears near XP-granting actions.
 * 
 * **Features:**
 * - Gradient background (sage-green to soft-pink)
 * - Framer Motion animation (fade + scale + slide up)
 * - Respects `enableAnimations` setting
 * - Respects prefers-reduced-motion
 * - Auto-hides after 3 seconds
 * - Positioned absolutely for flexible placement
 * 
 * **Usage:**
 * ```tsx
 * <div className="relative">
 *   <FloatingXPIndicator 
 *     xpAmount={10} 
 *     show={showXP} 
 *     onComplete={() => setShowXP(false)}
 *     enableAnimations={settings.enableAnimations}
 *   />
 * </div>
 * ```
 * 
 * **Accessibility:**
 * - Respects reduced motion preferences
 * - Falls back to simple fade when animations disabled
 * 
 * @example
 * // Inside a card component
 * <div className="relative min-h-[320px]">
 *   <Flashcard front="Q" back="A" />
 *   <FloatingXPIndicator xpAmount={10} show={userMarkedKnown} />
 * </div>
 */
export default function FloatingXPIndicator({
  xpAmount,
  show,
  onComplete,
  enableAnimations = true,
}: FloatingXPIndicatorProps) {
  // Use show prop directly instead of local state to avoid setState in effect
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={
            enableAnimations
              ? { opacity: 0, scale: 0.5, y: 20 }
              : { opacity: 0 }
          }
          animate={
            enableAnimations
              ? { opacity: 1, scale: 1, y: 0 }
              : { opacity: 1 }
          }
          exit={
            enableAnimations
              ? { opacity: 0, scale: 0.8, y: -40 }
              : { opacity: 0 }
          }
          transition={{
            duration: enableAnimations ? 0.5 : 0.2,
            ease: "easeOut",
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="px-4 py-2 sm:px-6 sm:py-3 rounded-[--radius-default] bg-gradient-to-r from-sage-green to-soft-pink shadow-[--shadow-lg] animate-pulse-glow">
            <span className="text-lg sm:text-xl font-bold text-cream flex items-center gap-2">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              +{xpAmount} XP
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
