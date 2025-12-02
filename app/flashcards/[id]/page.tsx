"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import FlashcardCarousel from "@/components/FlashcardCarousel";
import { 
  getFlashcardSet, 
  getNoteById, 
  FlashcardSet, 
  NoteRecord,
  saveFlashcardSet 
} from "@/lib/db";
import { awardXP } from "@/lib/studyForge";

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error";
  icon: React.ReactNode;
}

export default function FlashcardViewerPage() {
  const params = useParams();
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null);
  const [relatedNote, setRelatedNote] = useState<NoteRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Get ID from params
  const id = params.id as string;
  const numericId = parseInt(id, 10);

  // Toast helper
  const addToast = (message: string, type: "success" | "error", icon: React.ReactNode) => {
    const toastId = Date.now().toString();
    setToasts(prev => [...prev, { id: toastId, message, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toastId));
    }, 3000);
  };

  // Load flashcard set and related note
  useEffect(() => {
    async function loadData() {
      if (!id || isNaN(numericId)) {
        setError("Invalid flashcard set ID");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const set = await getFlashcardSet(numericId);
        
        if (!set) {
          setError("Flashcard set not found");
          setIsLoading(false);
          return;
        }

        setFlashcardSet(set);

        // Load related note if available
        if (set.noteId) {
          const note = await getNoteById(set.noteId);
          if (note) {
            setRelatedNote(note);
          }
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Failed to load flashcard set:", err);
        setError("Failed to load flashcard set");
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, numericId]);

  // Format date helper
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  // Save set handler (for unsaved sets)
  const handleSaveSet = async () => {
    if (!flashcardSet || flashcardSet.id) return; // Already saved

    try {
      setSaving(true);
      const newId = await saveFlashcardSet({
        noteId: flashcardSet.noteId,
        subject: flashcardSet.subject,
        topic: flashcardSet.topic,
        difficulty: flashcardSet.difficulty,
        createdAt: flashcardSet.createdAt,
        cards: flashcardSet.cards,
      });

      if (newId) {
        setFlashcardSet({ ...flashcardSet, id: newId });
        
        // Award XP for saving flashcards
        try {
          await awardXP(25, 'Save flashcards');
        } catch (xpError) {
          console.error('Failed to award XP:', xpError);
        }
        
        addToast("Flashcard set saved successfully! (+25 XP)", "success", (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ));
      }
    } catch (err) {
      console.error("Failed to save flashcard set:", err);
      addToast("Failed to save flashcard set", "error", (
        <svg className="h-5 w-5 animate-shake-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ));
    } finally {
      setSaving(false);
    }
  };

  // Download PDF handler
  const handleDownloadPDF = async () => {
    if (!flashcardSet || !contentRef.current) return;

    setPdfExporting(true);
    try {
      // Dynamically import html2pdf.js (browser-only)
      const html2pdf = (await import("html2pdf.js")).default;

      // Create a printable version of the flashcards
      const printContent = document.createElement("div");
      printContent.style.padding = "40px";
      printContent.style.fontFamily = "Inter, sans-serif";
      printContent.style.color = "#565264"; // charcoal

      // Add header
      const header = document.createElement("div");
      header.style.marginBottom = "30px";
      header.innerHTML = `
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; margin-bottom: 10px; color: #565264;">
          ${flashcardSet.topic}
        </h1>
        <p style="font-size: 14px; color: #706677; margin-bottom: 5px;">
          Subject: ${flashcardSet.subject} | Difficulty: ${flashcardSet.difficulty}
        </p>
        <p style="font-size: 12px; color: #706677;">
          ${flashcardSet.cards.length} flashcards | Created: ${formatDate(flashcardSet.createdAt)}
        </p>
        <hr style="margin-top: 20px; border: none; border-top: 2px solid #a8b5a0;" />
      `;
      printContent.appendChild(header);

      // Add flashcards
      flashcardSet.cards.forEach((card, index) => {
        const cardDiv = document.createElement("div");
        cardDiv.style.marginBottom = "25px";
        cardDiv.style.pageBreakInside = "avoid";
        cardDiv.innerHTML = `
          <div style="background: #faf8f5; padding: 20px; border-radius: 12px; border-left: 4px solid #ccb7ae;">
            <p style="font-weight: 600; color: #565264; margin-bottom: 10px; font-size: 14px;">
              Card ${index + 1} of ${flashcardSet.cards.length}
            </p>
            <div style="background: #ccb7ae; padding: 15px; border-radius: 8px; margin-bottom: 12px;">
              <p style="font-size: 12px; text-transform: uppercase; color: #565264; margin-bottom: 8px; font-weight: 500;">Question</p>
              <p style="font-size: 16px; color: #565264; line-height: 1.6;">${card.front}</p>
            </div>
            <div style="background: #a6808c; padding: 15px; border-radius: 8px;">
              <p style="font-size: 12px; text-transform: uppercase; color: #faf8f5; margin-bottom: 8px; font-weight: 500;">Answer</p>
              <p style="font-size: 16px; color: #faf8f5; line-height: 1.6;">${card.back}</p>
            </div>
          </div>
        `;
        printContent.appendChild(cardDiv);
      });

      const options = {
        margin: [0.5, 0.5, 0.5, 0.5] as [number, number, number, number],
        filename: `flashcards-${flashcardSet.topic.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.pdf`,
        image: { type: "jpeg" as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: "in" as const, format: "letter" as const, orientation: "portrait" as const },
      };

      await html2pdf().set(options).from(printContent).save();

      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);

      addToast("PDF downloaded successfully!", "success", (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ));
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      addToast("Failed to export PDF", "error", (
        <svg className="h-5 w-5 animate-shake-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ));
    } finally {
      setPdfExporting(false);
    }
  };

  // Download CSV handler
  const handleDownloadCSV = () => {
    if (!flashcardSet) return;

    setCsvExporting(true);
    try {
      // Build CSV content with proper escaping
      const escapeCSV = (str: string) => {
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (str.includes('"') || str.includes(",") || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const headers = ["Card Number", "Question (Front)", "Answer (Back)"];
      const rows = flashcardSet.cards.map((card, index) => [
        (index + 1).toString(),
        escapeCSV(card.front),
        escapeCSV(card.back),
      ]);

      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(",")),
      ].join("\n");

      // Add BOM for UTF-8 encoding
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `flashcards-${flashcardSet.topic.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast("CSV downloaded successfully!", "success", (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ));
    } catch (err) {
      console.error("Failed to generate CSV:", err);
      addToast("Failed to export CSV", "error", (
        <svg className="h-5 w-5 animate-shake-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ));
    } finally {
      setCsvExporting(false);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "text-sage-green bg-sage-green/10 border-sage-green/30";
      case "intermediate":
        return "text-dusty-mauve bg-dusty-mauve/10 border-dusty-mauve/30";
      case "advanced":
        return "text-terracotta bg-terracotta/10 border-terracotta/30";
      default:
        return "text-charcoal bg-charcoal/10 border-charcoal/30";
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dust-grey py-8 sm:py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Header skeleton */}
          <div className="mb-8 animate-fade-in">
            <div className="h-8 w-48 bg-almond-silk/50 rounded-[--radius-sm] animate-shimmer mb-4"></div>
            <div className="h-12 w-64 bg-cream/80 rounded-[--radius-default] animate-shimmer"></div>
          </div>

          {/* Metadata skeleton */}
          <div className="rounded-[--radius-lg] bg-cream p-6 shadow-[--shadow-lg] mb-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="h-6 w-32 bg-almond-silk/50 rounded animate-shimmer mb-4"></div>
                <div className="h-4 w-48 bg-almond-silk/30 rounded animate-shimmer mb-2"></div>
                <div className="h-4 w-40 bg-almond-silk/30 rounded animate-shimmer"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                <div className="h-10 w-24 bg-almond-silk/50 rounded-[--radius-default] animate-shimmer"></div>
                <div className="h-10 w-32 bg-almond-silk/50 rounded-[--radius-default] animate-shimmer"></div>
                <div className="h-10 w-28 bg-almond-silk/50 rounded-[--radius-default] animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Carousel skeleton */}
          <FlashcardCarousel cards={[]} isLoading={true} />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !flashcardSet) {
    return (
      <div className="min-h-screen bg-dust-grey py-8 sm:py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-[--radius-lg] border-2 border-dashed border-terracotta/30 bg-cream/50 p-12 text-center shadow-[--shadow-sm] animate-fade-in">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-terracotta/60 animate-shake-error"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="font-serif text-2xl text-charcoal/70 mb-3">
              {error || "Flashcard Set Not Found"}
            </h2>
            <p className="text-charcoal/60 mb-6">
              This flashcard set doesn&apos;t exist or may have been deleted.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-[--radius-default] bg-gradient-to-br from-sage-green to-sage-green/80 px-6 py-3 font-medium text-cream shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-lg] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-sage-green/50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2 rounded-[--radius-default] border-2 border-dusty-mauve bg-transparent px-6 py-3 font-medium text-dusty-mauve transition-all duration-[--animate-duration-fast] hover:bg-dusty-mauve hover:text-cream hover:shadow-[--shadow-md] hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-dusty-mauve/50"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isAlreadySaved = !!flashcardSet.id;

  return (
    <div className="min-h-screen bg-dust-grey py-6 sm:py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Navigation Header */}
        <div className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/"
              className="group flex items-center gap-2 text-charcoal/70 hover:text-charcoal transition-colors"
            >
              <svg className="h-5 w-5 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm font-medium">Back</span>
            </Link>
            <span className="text-charcoal/30">•</span>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors"
            >
              Dashboard
            </Link>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl bg-gradient-to-r from-charcoal to-dusty-mauve bg-clip-text text-transparent">
            {flashcardSet.topic}
          </h1>
        </div>

        {/* Metadata Card */}
        <div className="rounded-[--radius-lg] bg-cream p-6 sm:p-8 shadow-[--shadow-lg] mb-6 sm:mb-8 hover-lift animate-stagger-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Left: Metadata */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-charcoal/60 mb-2 uppercase tracking-wide">
                  Details
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-sage-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="text-charcoal">
                      <span className="font-medium">Subject:</span> {flashcardSet.subject}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-terracotta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <span className="text-charcoal">
                      <span className="font-medium">{flashcardSet.cards.length}</span> flashcards
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-dusty-mauve" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-charcoal">
                      <span className="font-medium">Created:</span> {formatDate(flashcardSet.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[--radius-sm] text-sm font-medium border ${getDifficultyColor(flashcardSet.difficulty)}`}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      {flashcardSet.difficulty.charAt(0).toUpperCase() + flashcardSet.difficulty.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Related Note */}
              {relatedNote && (
                <div className="pt-4 border-t border-charcoal/10">
                  <h4 className="text-sm font-medium text-charcoal/60 mb-2 uppercase tracking-wide">
                    Source Note
                  </h4>
                  <p className="text-sm text-charcoal/80 line-clamp-2">
                    {relatedNote.topic} — {relatedNote.rawText.substring(0, 100)}...
                  </p>
                </div>
              )}
            </div>

            {/* Right: Action Buttons */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-charcoal/60 mb-3 uppercase tracking-wide">
                Actions
              </h3>

              {/* Save Set Button */}
              <button
                onClick={handleSaveSet}
                disabled={isAlreadySaved || saving}
                className="group w-full flex items-center justify-center gap-2 rounded-[--radius-default] border-2 border-sage-green bg-transparent px-5 py-3 font-medium text-sage-green transition-all duration-[--animate-duration-fast] hover:bg-sage-green hover:text-cream hover:shadow-[--shadow-md] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-sage-green/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-sage-green disabled:hover:translate-y-0 min-h-[48px] touch-manipulation"
              >
                {saving ? (
                  <>
                    <svg className="h-5 w-5 animate-breathing-spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : isAlreadySaved ? (
                  <>
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Already Saved</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Save Set</span>
                  </>
                )}
              </button>

              {/* Download PDF Button */}
              <button
                onClick={handleDownloadPDF}
                disabled={pdfExporting}
                className={`group w-full flex items-center justify-center gap-2 rounded-[--radius-default] bg-gradient-to-br from-terracotta to-terracotta/80 px-5 py-3 font-medium text-cream shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-lg] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-terracotta/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 min-h-[48px] touch-manipulation ${showConfetti ? "animate-celebratory-pulse" : ""}`}
              >
                {pdfExporting ? (
                  <>
                    <svg className="h-5 w-5 animate-breathing-spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span>Download PDF</span>
                  </>
                )}
              </button>

              {/* Download CSV Button */}
              <button
                onClick={handleDownloadCSV}
                disabled={csvExporting}
                className="group w-full flex items-center justify-center gap-2 rounded-[--radius-default] bg-gradient-to-br from-dusty-mauve to-dusty-mauve/80 px-5 py-3 font-medium text-cream shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-lg] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-dusty-mauve/50 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 min-h-[48px] touch-manipulation"
              >
                {csvExporting ? (
                  <>
                    <svg className="h-5 w-5 animate-breathing-spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Exporting...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Download CSV</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Flashcard Carousel */}
        <div ref={contentRef} className="animate-stagger-2">
          <FlashcardCarousel
            cards={flashcardSet.cards}
            onComplete={() => {
              addToast("Great job! You've reviewed all cards.", "success", (
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ));
            }}
          />
        </div>

        {/* Toast Notifications */}
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ x: 400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 400, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-[--radius-default] px-4 py-3 shadow-[--shadow-xl] animate-toast-slide-in ${
                toast.type === "success"
                  ? "bg-sage-green text-cream"
                  : "bg-terracotta text-cream"
              }`}
              style={{ minWidth: "280px", maxWidth: "400px" }}
            >
              <div className="flex-shrink-0">{toast.icon}</div>
              <p className="flex-1 font-medium text-sm">{toast.message}</p>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="flex-shrink-0 hover:opacity-70 transition-opacity"
                aria-label="Dismiss"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Confetti Effect */}
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-40">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="absolute animate-confetti-pop"
                style={{
                  left: `${50 + Math.random() * 20 - 10}%`,
                  top: `${30 + Math.random() * 20 - 10}%`,
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  backgroundColor: [
                    "#a8b5a0",
                    "#d97d62",
                    "#e8c5c1",
                    "#a6808c",
                    "#ccb7ae",
                    "#706677",
                  ][i % 6],
                  animationDelay: `${i * 50}ms`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
