"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import InputCard from "@/components/InputCard";
import OutputCard from "@/components/OutputCard";
import SmartStructureCard from "@/components/SmartStructureCard";
import StudyForgeNavLink from "@/components/StudyForgeNavLink";
import XPFloatingBadge from "@/components/XPFloatingBadge";
import { generateNotes } from "./actions/generateNotes";
import { ClassificationResult } from "@/lib/prompts/classifierPrompt";
import { awardXP } from "@/lib/studyForge";

export default function Home() {
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState("bullet-points");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const outputRef = useRef<HTMLElement>(null);

  // Classification state
  const [rawInput, setRawInput] = useState("");
  const [classification, setClassification] = useState<ClassificationResult | null>(null);
  const [classificationLoading, setClassificationLoading] = useState(false);
  const [classificationError, setClassificationError] = useState<string | null>(null);

  // XP state
  const [showTransformXP, setShowTransformXP] = useState(false);

  const classifyNotes = async (rawText: string, transformedText: string) => {
    setClassificationLoading(true);
    setClassificationError(null);
    setClassification(null);

    try {
      const response = await fetch("/api/classifyNotes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notes: `${rawText}\n\n--- Formatted Output ---\n\n${transformedText}`,
        }),
      });

      const data = await response.json();

      if (data.success && data.classification) {
        setClassification(data.classification);
      } else {
        setClassificationError(data.error || "Failed to classify notes");
      }
    } catch (err) {
      console.error("Classification error:", err);
      setClassificationError("Failed to classify notes. Please try again.");
    } finally {
      setClassificationLoading(false);
    }
  };

  const handleGenerate = async ({ input }: { input: string }) => {
    setError("");
    setOutput("");
    setIsLoading(true);
    setRawInput(input);
    setShowTransformXP(false);
    
    // Reset classification state
    setClassification(null);
    setClassificationError(null);
    setClassificationLoading(false);
    
    try {
      const result = await generateNotes({ input, format });
      
      if (result.success && result.output) {
        setOutput(result.output);
        
        // Award XP for transforming notes
        try {
          await awardXP(15, 'Transform notes', 'create_notes');
          setShowTransformXP(true);
          // Hide badge after 3 seconds
          setTimeout(() => setShowTransformXP(false), 3000);
        } catch (xpError) {
          console.error('Failed to award XP:', xpError);
        }
        
        // Trigger classification in the background (non-blocking)
        classifyNotes(input, result.output);
        
        // Smooth scroll to output with a slight delay for better UX
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }, 300);
      } else {
        setError(result.error || "Failed to generate notes. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-dust-grey/80 border-b border-charcoal/10 shadow-[--shadow-sm]">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-[--radius-sm] bg-gradient-to-br from-sage-green to-soft-pink shadow-[--shadow-sm] animate-float-gentle">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <h1 className="font-serif text-xl font-semibold bg-gradient-to-r from-charcoal via-sage-green/80 to-charcoal bg-clip-text text-transparent sm:text-3xl md:text-4xl">
                EasyNotesAI
              </h1>
            </div>
            <nav className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/flashcards"
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium text-charcoal hover:text-terracotta rounded-[--radius-default] hover:bg-terracotta/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-terracotta/50 min-h-[40px] touch-manipulation"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="hidden sm:inline">Flashcards</span>
              </Link>
              <StudyForgeNavLink />
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

      <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 pb-24 sm:pb-12 relative z-10">
        <div className="mb-6 sm:mb-8 text-center animate-stagger-1">
          <p className="text-base sm:text-lg text-charcoal/80 px-4">
            Effortlessly transform your thoughts into organized notes — simple, fast, and AI-powered
          </p>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section className="animate-stagger-2" style={{ animationDelay: "0.1s" }}>
            <InputCard 
              onGenerate={handleGenerate} 
              error={error}
              format={format}
              onFormatChange={setFormat}
            />
          </section>

          <section ref={outputRef} className="animate-stagger-3" style={{ animationDelay: "0.2s" }}>
            <div className="relative">
              <OutputCard 
                output={output} 
                format={format} 
                isLoading={isLoading} 
                onFormatChange={setFormat}
              />
              {output && showTransformXP && (
                <div className="absolute top-4 right-4 z-10">
                  <XPFloatingBadge amount={15} visible={showTransformXP} />
                </div>
              )}
            </div>
          </section>

          {/* Smart Structure Card - rendered beneath OutputCard */}
          {output && (
            <section className="animate-fade-in">
              <SmartStructureCard
                classification={classification}
                isLoading={classificationLoading}
                error={classificationError}
                rawText={rawInput}
                transformedText={output}
              />
            </section>
          )}
        </div>
      </main>

      <footer className="mt-12 sm:mt-16 border-t border-charcoal/10 py-6 sm:py-8 relative z-10 bg-gradient-to-b from-transparent to-cream/30">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-soft-pink animate-pulse-glow" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-charcoal/60">
                Built with Next.js, TailwindCSS, and beautiful typography
              </p>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 text-sage-green" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 7H7v6h6V7z" />
                <path fillRule="evenodd" d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-charcoal/50">
                Powered by{" "}
                <a 
                  href="https://groq.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sage-green hover:text-terracotta transition-colors duration-300 font-medium hover-lift inline-block"
                >
                  Groq AI
                </a>
                {" "}with Llama3-70B
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
