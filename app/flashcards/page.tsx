"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { listFlashcardSets, deleteFlashcardSet, FlashcardSet } from "@/lib/db";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error";
  icon: React.ReactNode;
}

export default function FlashcardsListPage() {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast helper
  const addToast = (message: string, type: "success" | "error", icon: React.ReactNode) => {
    const toastId = Date.now().toString();
    setToasts((prev) => [...prev, { id: toastId, message, type, icon }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 3000);
  };

  // Load flashcard sets
  const loadFlashcardSets = useCallback(async () => {
    setIsLoading(true);
    try {
      const sets = await listFlashcardSets();
      setFlashcardSets(sets || []);
    } catch (error) {
      console.error("Failed to load flashcard sets:", error);
      addToast(
        "Failed to load flashcard sets",
        "error",
        <svg className="h-5 w-5 animate-shake-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load flashcard sets on mount
  useEffect(() => {
    loadFlashcardSets();
  }, [loadFlashcardSets]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this flashcard set?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteFlashcardSet(id);
      await loadFlashcardSets(); // Reload the list
      addToast(
        "Flashcard set deleted successfully",
        "success",
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    } catch (error) {
      console.error("Failed to delete flashcard set:", error);
      addToast(
        "Failed to delete flashcard set",
        "error",
        <svg className="h-5 w-5 animate-shake-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-sage-green/20 border-sage-green/30 text-sage-green";
      case "intermediate":
        return "bg-dusty-mauve/20 border-dusty-mauve/30 text-dusty-mauve";
      case "advanced":
        return "bg-terracotta/20 border-terracotta/30 text-terracotta";
      default:
        return "bg-charcoal/20 border-charcoal/30 text-charcoal";
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-dust-grey/80 border-b border-charcoal/10 shadow-[--shadow-sm]">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-[--radius-sm] bg-gradient-to-br from-terracotta to-dusty-mauve shadow-[--shadow-sm] animate-float-gentle">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h1 className="font-serif text-xl font-semibold bg-gradient-to-r from-charcoal via-terracotta/80 to-charcoal bg-clip-text text-transparent sm:text-3xl md:text-4xl">
                Flashcards
              </h1>
            </div>
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-charcoal hover:text-sage-green rounded-[--radius-default] hover:bg-sage-green/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sage-green/50 min-h-[40px] touch-manipulation"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="hidden sm:inline">Home</span>
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 text-sm font-medium bg-gradient-to-br from-dusty-mauve to-dusty-mauve/90 text-cream rounded-[--radius-default] shadow-[--shadow-sm] hover:shadow-[--shadow-md] hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-dusty-mauve/50 min-h-[40px] touch-manipulation"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal mb-2">
            Your Flashcard Sets
          </h2>
          <p className="text-charcoal/70">
            Review your flashcards and track your study progress
            {flashcardSets.length > 0 && ` • ${flashcardSets.length} set${flashcardSets.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-6 shadow-[--shadow-default] animate-shimmer"
              >
                <div className="h-6 w-32 bg-almond-silk rounded mb-3"></div>
                <div className="h-8 w-48 bg-almond-silk rounded mb-4"></div>
                <div className="h-4 w-24 bg-almond-silk rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-10 flex-1 bg-almond-silk rounded"></div>
                  <div className="h-10 w-10 bg-almond-silk rounded"></div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && flashcardSets.length === 0 && (
          <div className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-12 shadow-[--shadow-default] text-center animate-fade-in-scale">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-terracotta/20 to-dusty-mauve/20 mb-6 animate-float-gentle">
              <svg
                className="h-10 w-10 text-terracotta"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <h3 className="font-serif text-2xl font-semibold text-charcoal mb-3">
              No flashcard sets yet
            </h3>
            <p className="text-charcoal/60 mb-6 max-w-md mx-auto">
              Generate flashcards from your notes to start studying! Visit your dashboard and click
              &ldquo;Generate Flashcards&rdquo; on any note to create your first set.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-terracotta to-dusty-mauve text-cream font-medium rounded-[--radius-default] hover-lift shadow-[--shadow-default] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-terracotta/50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                Go to Dashboard
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-3 border-2 border-sage-green bg-transparent text-sage-green font-medium rounded-[--radius-default] hover:bg-sage-green hover:text-cream transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-sage-green/50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Create Notes
              </Link>
            </div>
          </div>
        )}

        {/* Flashcard Sets Grid */}
        {!isLoading && flashcardSets.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {flashcardSets.map((set, index) => {
              const isDeleting = deletingId === set.id;
              
              return (
                <div
                  key={set.id}
                  className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-6 shadow-[--shadow-default] hover-lift transition-all duration-300 animate-stagger-1 flex flex-col"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Header */}
                  <div className="mb-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-green/20 text-charcoal border border-sage-green/30">
                        {set.subject}
                      </span>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getDifficultyColor(set.difficulty)}`}
                      >
                        {set.difficulty}
                      </span>
                    </div>
                    <h3 className="font-serif text-xl font-semibold text-charcoal mb-2 line-clamp-2">
                      {set.topic}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-charcoal/60">
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <span>{set.cards.length} cards</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(set.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto pt-4 border-t border-charcoal/10">
                    <Link
                      href={`/flashcards/${set.id}`}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-br from-terracotta to-dusty-mauve text-cream font-medium rounded-[--radius-default] shadow-[--shadow-sm] hover:shadow-[--shadow-md] hover:scale-105 hover:-translate-y-0.5 active:scale-95 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-terracotta/50 min-h-[48px] touch-manipulation"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Review
                    </Link>
                    <button
                      onClick={() => handleDelete(set.id!)}
                      disabled={isDeleting}
                      className="flex items-center justify-center w-12 h-12 rounded-[--radius-default] bg-terracotta/10 hover:bg-terracotta/20 text-terracotta transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-terracotta/50 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
                      aria-label="Delete flashcard set"
                    >
                      {isDeleting ? (
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
                      ) : (
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 px-5 py-3 rounded-[--radius-default] shadow-[--shadow-lg] animate-toast-slide-in ${
              toast.type === "success"
                ? "bg-sage-green text-cream"
                : "bg-terracotta text-cream"
            }`}
          >
            {toast.icon}
            <span className="font-medium">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
