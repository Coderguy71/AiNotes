"use client";

import { useState, useRef } from "react";
import InputCard from "@/components/InputCard";
import OutputCard from "@/components/OutputCard";
import { generateNotes } from "./actions/generateNotes";

export default function Home() {
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState("bullet-points");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const outputRef = useRef<HTMLElement>(null);

  const handleGenerate = async ({ input }: { input: string }) => {
    setError("");
    setOutput("");
    setIsLoading(true);
    
    try {
      const result = await generateNotes({ input, format });
      
      if (result.success && result.output) {
        setOutput(result.output);
        
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
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-[--radius-sm] bg-gradient-to-br from-sage-green to-soft-pink shadow-[--shadow-sm] animate-float-gentle">
              <svg className="h-5 w-5 sm:h-6 sm:w-6 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h1 className="font-serif text-xl font-semibold bg-gradient-to-r from-charcoal via-sage-green/80 to-charcoal bg-clip-text text-transparent sm:text-3xl md:text-4xl">
              EasyNotesAI
            </h1>
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
            <OutputCard output={output} format={format} isLoading={isLoading} />
          </section>
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
