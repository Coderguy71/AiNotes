"use client";

import { useState } from "react";
import InputCard from "@/components/InputCard";
import OutputCard from "@/components/OutputCard";
import { generateNotes } from "./actions/generateNotes";

export default function Home() {
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async ({ input, format: selectedFormat }: { input: string; format: string }) => {
    setError("");
    setOutput("");
    setIsLoading(true);
    
    try {
      const result = await generateNotes({ input, format: selectedFormat });
      
      if (result.success && result.output) {
        setOutput(result.output);
        setFormat(selectedFormat);
      } else {
        setError(result.error || "Failed to generate notes. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 backdrop-blur-md bg-dust-grey/80 border-b border-charcoal/10 shadow-[--shadow-sm]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[--radius-sm] bg-gradient-to-br from-sage-green to-soft-pink shadow-[--shadow-sm]">
              <svg className="h-6 w-6 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h1 className="font-serif text-3xl font-semibold text-charcoal sm:text-4xl">
              Aesthetic Notes AI
            </h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center animate-fade-in">
          <p className="text-lg text-charcoal/80">
            Transform your thoughts into beautifully organized aesthetic notes powered by AI
          </p>
        </div>

        <div className="space-y-8">
          <section className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <InputCard onGenerate={handleGenerate} error={error} />
          </section>

          <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <OutputCard output={output} format={format} isLoading={isLoading} />
          </section>
        </div>
      </main>

      <footer className="mt-16 border-t border-charcoal/10 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-charcoal/60">
            Built with{" "}
            <span className="text-soft-pink">♥</span>
            {" "}using Next.js, TailwindCSS, and beautiful typography
          </p>
        </div>
      </footer>
    </div>
  );
}
