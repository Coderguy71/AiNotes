"use client";

import { useState } from "react";
import InputCard from "@/components/InputCard";
import OutputCard from "@/components/OutputCard";

export default function Home() {
  const [output, setOutput] = useState("");
  const [format, setFormat] = useState("");

  const handleGenerate = async ({ input, format: selectedFormat }: { input: string; format: string }) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    let generatedOutput = "";
    
    switch (selectedFormat) {
      case "bullet-points":
        const sentences = input.match(/[^.!?]+[.!?]+/g) || [input];
        generatedOutput = sentences
          .map((s) => `• ${s.trim()}`)
          .join("\n");
        break;
      case "paragraph":
        generatedOutput = `✨ ${input.trim()}\n\nThis beautifully captures your thoughts in a cohesive narrative that flows naturally from beginning to end.`;
        break;
      case "checklist":
        const tasks = input.match(/[^.!?]+[.!?]+/g) || [input];
        generatedOutput = tasks
          .map((t) => `☐ ${t.trim()}`)
          .join("\n");
        break;
      case "summary":
        const words = input.trim().split(/\s+/);
        const summary = words.slice(0, Math.min(30, words.length)).join(" ");
        generatedOutput = `📝 Summary:\n\n${summary}${words.length > 30 ? "..." : ""}\n\nKey Takeaway: ${words.slice(0, 10).join(" ")}...`;
        break;
      case "outline":
        const points = input.match(/[^.!?]+[.!?]+/g) || [input];
        generatedOutput = points
          .map((p, i) => `${i + 1}. ${p.trim()}`)
          .join("\n");
        break;
      default:
        generatedOutput = input;
    }
    
    setOutput(generatedOutput);
    setFormat(selectedFormat);
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
            <InputCard onGenerate={handleGenerate} />
          </section>

          <section className="animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <OutputCard output={output} format={format} />
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
