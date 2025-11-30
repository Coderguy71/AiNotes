"use client";

import { useState } from "react";
import { motion } from "framer-motion";

/**
 * FlashcardProps interface
 * 
 * @property front - Text to display on the front of the card (question/prompt)
 * @property back - Text to display on the back of the card (answer/explanation)
 * @property className - Optional additional CSS classes for custom styling
 * @property frontClassName - Optional CSS classes for front face customization
 * @property backClassName - Optional CSS classes for back face customization
 * @property onFlip - Optional callback triggered when the card flips
 */
export interface FlashcardProps {
  front: string;
  back: string;
  className?: string;
  frontClassName?: string;
  backClassName?: string;
  onFlip?: (isFlipped: boolean) => void;
}

/**
 * Flashcard Component
 * 
 * A single flippable flashcard with smooth 3D flip animation powered by Framer Motion.
 * 
 * **Features:**
 * - Click/tap to flip between front and back
 * - Keyboard support: Space or Enter to flip
 * - Smooth 3D flip animation with perspective
 * - Respects prefers-reduced-motion for accessibility
 * - Subtle hover state with scale and shadow effects
 * - SSR-safe with Framer Motion guards
 * 
 * **Styling:**
 * - Front face: Almond-silk background (#ccb7ae)
 * - Back face: Dusty-mauve background (#a6808c)
 * - Text: Charcoal (#565264)
 * - Border radius: 16px (--radius-default)
 * - Shadows: Soft elevation with hover enhancement
 * 
 * **Accessibility:**
 * - Keyboard navigable (Space/Enter to flip)
 * - ARIA labels for screen readers
 * - Focus ring for keyboard users
 * - Reduced motion support
 * 
 * **Usage:**
 * ```tsx
 * <Flashcard 
 *   front="What is the capital of France?" 
 *   back="Paris" 
 *   onFlip={(flipped) => console.log('Flipped:', flipped)}
 * />
 * ```
 * 
 * **Customization:**
 * - Use `className` to style the card container
 * - Use `frontClassName` to customize front face
 * - Use `backClassName` to customize back face
 * - Override default colors by passing Tailwind utility classes
 * 
 * @example
 * // Custom colors
 * <Flashcard 
 *   front="Question" 
 *   back="Answer"
 *   frontClassName="bg-sage-green text-cream"
 *   backClassName="bg-terracotta text-cream"
 * />
 */
export default function Flashcard({
  front,
  back,
  className = "",
  frontClassName = "",
  backClassName = "",
  onFlip,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    const newFlippedState = !isFlipped;
    setIsFlipped(newFlippedState);
    onFlip?.(newFlippedState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      handleFlip();
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[280px] sm:min-h-[320px] cursor-pointer group ${className}`}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={isFlipped ? "Flashcard showing answer, click to show question" : "Flashcard showing question, click to show answer"}
      aria-pressed={isFlipped}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="relative w-full h-full"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          duration: 0.6,
          ease: [0.4, 0.0, 0.2, 1],
        }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Front Face */}
        <div
          className={`absolute inset-0 rounded-[--radius-default] bg-almond-silk p-6 sm:p-8 shadow-[--shadow-md] flex flex-col items-center justify-center text-center transition-shadow duration-300 group-hover:shadow-[--shadow-lg] group-focus:ring-2 group-focus:ring-dusty-mauve group-focus:ring-offset-2 ${frontClassName}`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
          }}
        >
          <div className="flex flex-col h-full w-full">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-charcoal/60">
                Question
              </span>
              <svg
                className="h-5 w-5 text-charcoal/40 transition-transform duration-300 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <p className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-charcoal leading-relaxed">
                {front}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-charcoal/10">
              <p className="text-xs text-charcoal/50 flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
                Click or press Space to reveal
              </p>
            </div>
          </div>
        </div>

        {/* Back Face */}
        <div
          className={`absolute inset-0 rounded-[--radius-default] bg-dusty-mauve p-6 sm:p-8 shadow-[--shadow-md] flex flex-col items-center justify-center text-center transition-shadow duration-300 group-hover:shadow-[--shadow-lg] group-focus:ring-2 group-focus:ring-almond-silk group-focus:ring-offset-2 ${backClassName}`}
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          <div className="flex flex-col h-full w-full">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-cream/90">
                Answer
              </span>
              <svg
                className="h-5 w-5 text-cream/70 transition-transform duration-300 group-hover:scale-110"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div className="flex-1 flex items-center justify-center">
              <p className="text-lg sm:text-xl md:text-2xl font-serif font-semibold text-cream leading-relaxed">
                {back}
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-cream/20">
              <p className="text-xs text-cream/70 flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Click or press Space to flip back
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Hover scale effect container */}
      <style jsx>{`
        div[role="button"] {
          transition: transform 0.2s ease;
        }
        div[role="button"]:hover {
          transform: scale(1.02);
        }
        div[role="button"]:active {
          transform: scale(0.98);
        }
        
        @media (prefers-reduced-motion: reduce) {
          div[role="button"],
          div[role="button"]:hover,
          div[role="button"]:active {
            transform: none !important;
          }
        }
      `}</style>
    </div>
  );
}
