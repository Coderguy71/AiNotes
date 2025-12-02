"use client";

/**
 * SmartStructureCard Component
 * 
 * Displays AI classification results (subject, topic, difficulty, tags) for generated notes
 * and provides functionality to save notes to history with StudyForge XP integration.
 * 
 * **XP Integration:**
 * Awards 50 XP when user clicks "Save to History" button and successfully saves note to IndexedDB.
 * This contributes to the 'create_notes' mission progress.
 * 
 * **Features:**
 * - Collapsible card with expand/collapse animation
 * - Loading state with skeleton shimmer
 * - Error state with retry message
 * - Color-coded difficulty badges (beginner, intermediate, advanced)
 * - Subject and topic display
 * - Tag list with color-coordinated styling
 * - Save button with loading spinner
 * - XP badge shows "+50 XP" after successful save
 * - Toast notifications for success/error
 * 
 * See STUDYFORGE.md > XP Integration Points for details on XP awards.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClassificationResult } from "@/lib/prompts/classifierPrompt";
import { saveNote } from "@/lib/db";
import { awardXP } from "@/lib/studyForge";
import XPFloatingBadge from "@/components/XPFloatingBadge";

interface SmartStructureCardProps {
  classification: ClassificationResult | null;
  isLoading: boolean;
  error: string | null;
  rawText: string;
  transformedText: string;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error";
}

export default function SmartStructureCard({
  classification,
  isLoading,
  error,
  rawText,
  transformedText,
}: SmartStructureCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showSaveXP, setShowSaveXP] = useState(false);

  const addToast = (message: string, type: "success" | "error") => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleSaveToHistory = async () => {
    if (!classification || isSaved || isSaving) return;

    setIsSaving(true);
    try {
      const noteId = await saveNote({
        timestamp: new Date().toISOString(),
        rawText,
        transformedText,
        subject: classification.subject,
        topic: classification.topic,
        difficulty: classification.difficulty,
        tags: classification.tags,
      });

      if (noteId !== null) {
        setIsSaved(true);
        addToast("Note saved to history successfully!", "success");
        
        // Award XP for saving note
        try {
          await awardXP(50, 'Add note', 'create_notes');
          setShowSaveXP(true);
          // Hide badge after 3 seconds
          setTimeout(() => setShowSaveXP(false), 3000);
        } catch (xpError) {
          console.error('Failed to award XP:', xpError);
        }
      } else {
        addToast("Failed to save note (SSR environment)", "error");
      }
    } catch (error) {
      console.error("Failed to save note:", error);
      addToast("Failed to save note to history", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-sage-green/20 text-sage-green border-sage-green/30";
      case "intermediate":
        return "bg-dusty-mauve/20 text-dusty-mauve border-dusty-mauve/30";
      case "advanced":
        return "bg-terracotta/20 text-terracotta border-terracotta/30";
      default:
        return "bg-charcoal/20 text-charcoal border-charcoal/30";
    }
  };

  // Don't render if no data and not loading
  if (!isLoading && !classification && !error) {
    return null;
  }

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="rounded-[--radius-lg] bg-cream p-4 sm:p-6 md:p-8 shadow-[--shadow-lg] hover-lift"
      >
        {/* Header with collapse toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between mb-4 group focus:outline-none"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? "Collapse smart structure" : "Expand smart structure"}
        >
          <div className="flex items-center gap-3">
            <svg
              className="h-6 w-6 text-dusty-mauve"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <h2 className="font-serif text-2xl sm:text-3xl bg-gradient-to-r from-charcoal to-dusty-mauve bg-clip-text text-transparent">
              Smart Structure
            </h2>
          </div>
          <svg
            className={`h-6 w-6 text-charcoal/60 transition-transform duration-300 ${
              isExpanded ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        <div className="h-px bg-gradient-to-r from-transparent via-dusty-mauve/30 to-transparent mb-4"></div>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              {/* Loading state */}
              {isLoading && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-charcoal/60">
                    <svg
                      className="h-5 w-5 animate-breathing-spinner"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    <span className="text-sm">Analyzing note structure...</span>
                  </div>

                  <div className="space-y-3">
                    <div className="h-8 animate-shimmer rounded-[--radius-sm] w-1/2"></div>
                    <div className="h-8 animate-shimmer rounded-[--radius-sm] w-2/3"></div>
                    <div className="flex gap-2 flex-wrap">
                      <div className="h-7 w-20 animate-shimmer rounded-full"></div>
                      <div className="h-7 w-24 animate-shimmer rounded-full"></div>
                      <div className="h-7 w-28 animate-shimmer rounded-full"></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error state */}
              {!isLoading && error && (
                <div className="rounded-[--radius-default] bg-terracotta/10 border border-terracotta/30 p-4 animate-fade-in">
                  <div className="flex items-start gap-3">
                    <svg
                      className="h-5 w-5 text-terracotta flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div className="flex-1">
                      <h3 className="font-semibold text-terracotta mb-1 text-sm">
                        Classification Error
                      </h3>
                      <p className="text-sm text-charcoal/80">{error}</p>
                      <p className="text-xs text-charcoal/60 mt-2">
                        Your notes are still available above. Classification is optional.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success state with classification data */}
              {!isLoading && !error && classification && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.3 }}
                  className="space-y-4 sm:space-y-5"
                >
                  {/* Subject */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-charcoal/70 uppercase tracking-wide">
                      Subject
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-sage-green/20 to-sage-green/10 border-2 border-sage-green/30 px-4 py-2 text-sm font-medium text-sage-green shadow-sm">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                        {classification.subject}
                      </span>
                    </div>
                  </div>

                  {/* Topic */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-charcoal/70 uppercase tracking-wide">
                      Topic
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-br from-soft-pink/20 to-soft-pink/10 border-2 border-soft-pink/30 px-4 py-2 text-sm font-medium text-charcoal shadow-sm">
                        <svg
                          className="h-4 w-4 text-soft-pink"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                          />
                        </svg>
                        {classification.topic}
                      </span>
                    </div>
                  </div>

                  {/* Difficulty */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-charcoal/70 uppercase tracking-wide">
                      Difficulty
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border-2 px-4 py-2 text-sm font-medium shadow-sm capitalize ${getDifficultyColor(
                          classification.difficulty
                        )}`}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 10V3L4 14h7v7l9-11h-7z"
                          />
                        </svg>
                        {classification.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-charcoal/70 uppercase tracking-wide">
                      Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {classification.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1.5 rounded-full bg-almond-silk border border-charcoal/20 px-3 py-1.5 text-xs font-medium text-charcoal/80 shadow-sm hover:shadow-md transition-shadow duration-200"
                        >
                          <span className="text-dusty-mauve">#</span>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Save to History Button */}
                  <div className="pt-4 border-t border-charcoal/10">
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={handleSaveToHistory}
                        disabled={isSaving || isSaved}
                        className={`group relative flex items-center justify-center gap-2 rounded-[--radius-default] px-6 py-3.5 font-medium shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] min-h-[48px] touch-manipulation focus:outline-none focus:ring-2 ${
                          isSaved
                            ? "bg-sage-green/20 text-sage-green border-2 border-sage-green/30 cursor-default"
                            : "bg-gradient-to-br from-dusty-mauve to-dusty-mauve/80 text-cream hover:scale-105 hover:shadow-[--shadow-lg] hover:-translate-y-0.5 active:scale-95 focus:ring-dusty-mauve/50"
                        } ${isSaving ? "opacity-70 cursor-wait" : ""} disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                      {isSaving ? (
                        <>
                          <svg
                            className="h-5 w-5 animate-breathing-spinner"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Saving...
                        </>
                      ) : isSaved ? (
                        <>
                          <svg
                            className="h-5 w-5 animate-confetti-pop"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          Saved to History
                        </>
                      ) : (
                        <>
                          <svg
                            className="h-5 w-5 transition-transform group-hover:scale-110"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                            />
                          </svg>
                          Save to History
                        </>
                      )}
                      </button>
                      {isSaved && showSaveXP && (
                        <XPFloatingBadge amount={50} visible={showSaveXP} />
                      )}
                    </div>
                    {isSaved && (
                      <p className="mt-2 text-xs text-sage-green animate-fade-in">
                        ✓ This note has been saved and can be viewed in your history
                      </p>
                    )}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Toast notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 rounded-[--radius-default] px-4 py-3 shadow-[--shadow-xl] min-w-[250px] ${
                toast.type === "success"
                  ? "bg-sage-green text-cream"
                  : "bg-terracotta text-cream"
              }`}
            >
              {toast.type === "success" ? (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5 animate-shake-error"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              )}
              <span className="font-medium text-sm">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
