'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';

interface XPFloatingBadgeProps {
  amount: number;
  visible?: boolean;
  className?: string;
}

/**
 * Inline XP indicator badge that respects user settings
 * Shows "+XX XP" with a subtle animation
 */
export default function XPFloatingBadge({ amount, visible = true, className = '' }: XPFloatingBadgeProps) {
  const { state } = useStudyForge();

  // Respect notifications setting
  const notificationsEnabled = state?.settings?.notificationsEnabled !== false;

  if (!visible || !notificationsEnabled) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.span
        initial={{ opacity: 0, scale: 0.8, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full bg-gradient-to-r from-sage-green to-soft-pink text-cream shadow-sm ${className}`}
      >
        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        +{amount} XP
      </motion.span>
    </AnimatePresence>
  );
}
