"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Flashcard from "./Flashcard";
import FloatingXPIndicator from "./FloatingXPIndicator";

/**
 * FlashcardData interface
 * 
 * @property front - Text for the front of the card
 * @property back - Text for the back of the card
 */
export interface FlashcardData {
  front: string;
  back: string;
}

/**
 * FlashcardCarouselProps interface
 * 
 * @property cards - Array of flashcard data objects
 * @property onCardChange - Optional callback when navigating between cards
 * @property onComplete - Optional callback when user reaches the last card
 * @property isLoading - Optional loading state to show skeleton
 * @property emptyMessage - Optional custom message when cards array is empty
 * @property showProgress - Optional flag to show/hide progress bar (default: true)
 * @property autoFlipOnNav - Optional flag to auto-flip card back to front when navigating (default: true)
 * @property className - Optional additional CSS classes
 * @property showMasteryControls - Optional flag to show mastery control buttons (default: false)
 * @property onMarkKnown - Callback when user marks card as known
 * @property onMarkReview - Callback when user marks card for review
 * @property enableAnimations - Whether to enable XP animations (default: true)
 */
export interface FlashcardCarouselProps {
  cards: FlashcardData[];
  onCardChange?: (index: number) => void;
  onComplete?: () => void;
  isLoading?: boolean;
  emptyMessage?: string;
  showProgress?: boolean;
  autoFlipOnNav?: boolean;
  className?: string;
  showMasteryControls?: boolean;
  onMarkKnown?: (cardIndex: number) => void;
  onMarkReview?: (cardIndex: number) => void;
  enableAnimations?: boolean;
}

/**
 * FlashcardCarousel Component
 * 
 * A responsive carousel for navigating through multiple flashcards with animations,
 * keyboard shortcuts, and progress tracking.
 * 
 * **Features:**
 * - Prev/Next navigation with disabled states at boundaries
 * - Keyboard shortcuts: Arrow Left/Right for navigation
 * - Animated card transitions (slide + fade)
 * - Visual progress bar with percentage
 * - "Card X of Y" accessibility label
 * - Auto-reset flip state when navigating (optional)
 * - Loading state with skeleton UI
 * - Empty state with custom messaging
 * - Fully responsive (full width mobile, constrained desktop)
 * 
 * **Keyboard Shortcuts:**
 * - ← Left Arrow: Previous card
 * - → Right Arrow: Next card
 * - Space/Enter: Flip current card (handled by Flashcard component)
 * 
 * **Responsive Design:**
 * - Mobile (<640px): Full width, stacked buttons
 * - Desktop (≥640px): Max width 800px, centered, horizontal button layout
 * 
 * **Accessibility:**
 * - ARIA labels for navigation buttons
 * - Screen reader friendly progress announcements
 * - Keyboard navigation support
 * - Focus management
 * - Reduced motion support
 * 
 * **Usage:**
 * ```tsx
 * <FlashcardCarousel
 *   cards={[
 *     { front: "What is React?", back: "A JavaScript library for building UIs" },
 *     { front: "What is JSX?", back: "JavaScript XML syntax extension" }
 *   ]}
 *   onCardChange={(index) => console.log('Card:', index)}
 *   onComplete={() => console.log('Finished all cards!')}
 * />
 * ```
 * 
 * **Loading State:**
 * ```tsx
 * <FlashcardCarousel cards={[]} isLoading={true} />
 * ```
 * 
 * **Empty State:**
 * ```tsx
 * <FlashcardCarousel 
 *   cards={[]} 
 *   emptyMessage="No flashcards available. Generate some from your notes!" 
 * />
 * ```
 * 
 * **Customization:**
 * - Use `className` to add custom container styles
 * - Toggle `showProgress` to hide/show progress bar
 * - Toggle `autoFlipOnNav` to control flip behavior on navigation
 * - Progress bar uses brand colors: sage-green gradient
 * - Navigation buttons use dusty-mauve for primary actions
 * 
 * @example
 * // Custom styling
 * <FlashcardCarousel
 *   cards={myCards}
 *   showProgress={false}
 *   autoFlipOnNav={false}
 *   className="my-8"
 * />
 */
export default function FlashcardCarousel({
  cards,
  onCardChange,
  onComplete,
  isLoading = false,
  emptyMessage = "No flashcards available",
  showProgress = true,
  autoFlipOnNav = true,
  className = "",
  showMasteryControls = false,
  onMarkKnown,
  onMarkReview,
  enableAnimations = true,
}: FlashcardCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 for next, -1 for prev
  const [cardKey, setCardKey] = useState(0); // Force re-mount to reset flip state
  const [showXPIndicator, setShowXPIndicator] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<number>>(new Set());

  const totalCards = cards.length;
  const isFirstCard = currentIndex === 0;
  const isLastCard = currentIndex === totalCards - 1;
  const progress = totalCards > 0 ? ((currentIndex + 1) / totalCards) * 100 : 0;

  const handleNext = useCallback(() => {
    if (currentIndex === totalCards - 1) {
      onComplete?.();
      return;
    }

    setDirection(1);
    const newIndex = currentIndex + 1;
    setCurrentIndex(newIndex);
    
    if (autoFlipOnNav) {
      setCardKey(prev => prev + 1); // Force card re-mount to reset flip
    }
    
    onCardChange?.(newIndex);
  }, [currentIndex, totalCards, autoFlipOnNav, onComplete, onCardChange]);

  const handlePrevious = useCallback(() => {
    if (currentIndex === 0) return;

    setDirection(-1);
    const newIndex = currentIndex - 1;
    setCurrentIndex(newIndex);
    
    if (autoFlipOnNav) {
      setCardKey(prev => prev + 1); // Force card re-mount to reset flip
    }
    
    onCardChange?.(newIndex);
  }, [currentIndex, autoFlipOnNav, onCardChange]);

  // Handle marking card as known
  const handleMarkKnown = useCallback(() => {
    if (knownCards.has(currentIndex)) return; // Already marked
    
    setKnownCards(prev => new Set(prev).add(currentIndex));
    setShowXPIndicator(true);
    onMarkKnown?.(currentIndex);
    
    // Auto-advance to next card after short delay
    setTimeout(() => {
      if (currentIndex < totalCards - 1) {
        handleNext();
      }
    }, 1500);
  }, [currentIndex, knownCards, onMarkKnown, totalCards, handleNext]);

  // Handle marking card for review
  const handleMarkReview = useCallback(() => {
    onMarkReview?.(currentIndex);
    
    // Auto-advance to next card
    if (currentIndex < totalCards - 1) {
      handleNext();
    }
  }, [currentIndex, onMarkReview, totalCards, handleNext]);

  // Keyboard navigation with mastery controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === "ArrowRight" && currentIndex < totalCards - 1) {
        e.preventDefault();
        handleNext();
      } else if (showMasteryControls && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        handleMarkKnown();
      } else if (showMasteryControls && (e.key === "r" || e.key === "R")) {
        e.preventDefault();
        handleMarkReview();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, totalCards, handleNext, handlePrevious, showMasteryControls, handleMarkKnown, handleMarkReview]);

  // Slide variants for card animations
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 ${className}`}>
        <div className="rounded-[--radius-lg] bg-cream p-6 sm:p-8 shadow-[--shadow-lg] animate-fade-in">
          {/* Loading skeleton */}
          <div className="mb-6">
            <div className="h-8 w-48 animate-shimmer rounded-[--radius-sm] mb-4"></div>
            <div className="w-full h-3 bg-almond-silk/30 rounded-full overflow-hidden">
              <div className="h-full w-1/3 animate-shimmer"></div>
            </div>
          </div>

          <div className="min-h-[320px] rounded-[--radius-default] bg-almond-silk/50 shadow-[--shadow-md] flex items-center justify-center mb-6">
            <div className="text-center space-y-4">
              <svg
                className="h-12 w-12 text-charcoal/30 mx-auto animate-breathing-spinner"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-charcoal/60 font-medium">Loading flashcards...</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 h-12 animate-shimmer rounded-[--radius-default]"></div>
            <div className="flex-1 h-12 animate-shimmer rounded-[--radius-default]"></div>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (totalCards === 0) {
    return (
      <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 ${className}`}>
        <div className="rounded-[--radius-lg] border-2 border-dashed border-charcoal/20 bg-cream/50 p-12 text-center shadow-[--shadow-sm] animate-fade-in">
          <svg
            className="mx-auto mb-4 h-16 w-16 text-charcoal/30 animate-float-gentle"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <p className="font-serif text-xl text-charcoal/70 mb-2">{emptyMessage}</p>
          <p className="text-sm text-charcoal/50">
            Create flashcards from your notes to start studying
          </p>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div className={`w-full max-w-3xl mx-auto p-4 sm:p-6 ${className}`}>
      <div className="rounded-[--radius-lg] bg-cream p-4 sm:p-6 md:p-8 shadow-[--shadow-lg] hover-lift animate-fade-in">
        {/* Header with card counter */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-xl sm:text-2xl bg-gradient-to-r from-charcoal to-dusty-mauve bg-clip-text text-transparent">
              Study Cards
            </h3>
            <span
              className="text-sm font-medium text-charcoal/70 bg-almond-silk px-3 py-1.5 rounded-[--radius-sm]"
              aria-live="polite"
              aria-atomic="true"
            >
              Card {currentIndex + 1} of {totalCards}
            </span>
          </div>

          {/* Progress bar */}
          {showProgress && (
            <div className="space-y-2">
              <div className="w-full h-3 bg-almond-silk/50 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-sage-green to-soft-pink rounded-full shadow-sm"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between text-xs text-charcoal/60">
                <span>{Math.round(progress)}% Complete</span>
                <span>{totalCards - currentIndex - 1} cards remaining</span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-sage-green/30 to-transparent mb-4 sm:mb-6"></div>

        {/* Flashcard with animation */}
        <div className="mb-4 sm:mb-6 relative" style={{ minHeight: "320px" }}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={`${currentIndex}-${cardKey}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
              }}
              className="absolute inset-0"
            >
              <Flashcard front={currentCard.front} back={currentCard.back} />
              
              {/* Floating XP Indicator */}
              {showMasteryControls && (
                <FloatingXPIndicator
                  xpAmount={10}
                  show={showXPIndicator}
                  onComplete={() => setShowXPIndicator(false)}
                  enableAnimations={enableAnimations}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="h-px bg-gradient-to-r from-transparent via-terracotta/30 to-transparent mb-4 sm:mb-6"></div>

        {/* Mastery Control Buttons */}
        {showMasteryControls && (
          <>
            <div className="mb-6 space-y-3">
              <h4 className="text-sm font-medium text-charcoal/70 text-center uppercase tracking-wide">
                How well did you know this?
              </h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleMarkKnown}
                  disabled={knownCards.has(currentIndex)}
                  className="group relative flex items-center justify-center gap-2 rounded-[--radius-default] bg-gradient-to-br from-sage-green to-sage-green/80 px-5 sm:px-6 py-4 font-medium text-cream shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-lg] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-sage-green/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 min-h-[56px] flex-1 touch-manipulation"
                  aria-label="Mark as known - awards 10 XP"
                >
                  <svg className="h-6 w-6 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-base sm:text-lg">
                    {knownCards.has(currentIndex) ? "Already Reviewed ✓" : "I knew this"}
                  </span>
                  <span className="hidden sm:inline-block ml-2 px-2 py-0.5 bg-cream/20 rounded-[--radius-sm] text-xs font-bold">
                    +10 XP
                  </span>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-3 py-1.5 rounded whitespace-nowrap animate-tooltip-in z-10">
                    Press K
                  </span>
                </button>

                <button
                  onClick={handleMarkReview}
                  className="group relative flex items-center justify-center gap-2 rounded-[--radius-default] border-2 border-terracotta bg-transparent px-5 sm:px-6 py-4 font-medium text-terracotta transition-all duration-[--animate-duration-fast] hover:bg-terracotta hover:text-cream hover:shadow-[--shadow-md] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-terracotta/50 min-h-[56px] flex-1 touch-manipulation"
                  aria-label="Mark for review - no XP"
                >
                  <svg className="h-6 w-6 transition-transform group-hover:rotate-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className="text-base sm:text-lg">Need review</span>
                  <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-3 py-1.5 rounded whitespace-nowrap animate-tooltip-in z-10">
                    Press R
                  </span>
                </button>
              </div>
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-dusty-mauve/30 to-transparent mb-4 sm:mb-6"></div>
          </>
        )}

        {/* Navigation buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handlePrevious}
            disabled={isFirstCard}
            className="group relative flex items-center justify-center gap-2 rounded-[--radius-default] border-2 border-dusty-mauve bg-transparent px-5 sm:px-6 py-3.5 font-medium text-dusty-mauve transition-all duration-[--animate-duration-fast] hover:bg-dusty-mauve hover:text-cream hover:shadow-[--shadow-md] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-dusty-mauve/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-dusty-mauve disabled:hover:translate-y-0 min-h-[48px] flex-1 touch-manipulation"
            aria-label="Previous card"
          >
            <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="hidden sm:inline">Previous</span>
            <span className="sm:hidden">Prev</span>
            {!isFirstCard && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-3 py-1.5 rounded whitespace-nowrap animate-tooltip-in z-10">
                ← Arrow Left
              </span>
            )}
          </button>

          <button
            onClick={handleNext}
            className="group relative flex items-center justify-center gap-2 rounded-[--radius-default] bg-gradient-to-br from-dusty-mauve to-dusty-mauve/80 px-5 sm:px-6 py-3.5 font-medium text-cream shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-lg] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-dusty-mauve/50 disabled:opacity-40 disabled:cursor-not-allowed min-h-[48px] flex-1 touch-manipulation"
            aria-label={isLastCard ? "Complete review" : "Next card"}
          >
            <span className="hidden sm:inline">{isLastCard ? "Complete" : "Next"}</span>
            <span className="sm:hidden">{isLastCard ? "Done" : "Next"}</span>
            {isLastCard ? (
              <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {!isLastCard && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-3 py-1.5 rounded whitespace-nowrap animate-tooltip-in z-10">
                Arrow Right →
              </span>
            )}
            {isLastCard && (
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-3 py-1.5 rounded whitespace-nowrap animate-tooltip-in z-10">
                Finish review
              </span>
            )}
          </button>
        </div>

        {/* Keyboard hints */}
        <div className="mt-6 pt-4 border-t border-charcoal/10">
          <p className="text-xs text-center text-charcoal/50 flex items-center justify-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-almond-silk rounded text-charcoal/70 font-mono text-xs shadow-sm">←</kbd>
              <span>Previous</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-almond-silk rounded text-charcoal/70 font-mono text-xs shadow-sm">→</kbd>
              <span>Next</span>
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-2 py-1 bg-almond-silk rounded text-charcoal/70 font-mono text-xs shadow-sm">Space</kbd>
              <span>Flip</span>
            </span>
            {showMasteryControls && (
              <>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-sage-green/30 rounded text-charcoal/70 font-mono text-xs shadow-sm">K</kbd>
                  <span>Known</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-2 py-1 bg-terracotta/30 rounded text-charcoal/70 font-mono text-xs shadow-sm">R</kbd>
                  <span>Review</span>
                </span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
