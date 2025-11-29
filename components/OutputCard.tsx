"use client";

import { useState } from "react";

interface OutputCardProps {
  output: string;
  format: string;
}

export default function OutputCard({ output, format }: OutputCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!output) return;
    
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = () => {
    if (!output) return;
    
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `aesthetic-notes-${format}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!output) {
    return (
      <div className="rounded-[--radius-lg] border-2 border-dashed border-charcoal/20 bg-cream/50 p-12 text-center shadow-[--shadow-sm]">
        <div className="mx-auto max-w-md">
          <svg 
            className="mx-auto mb-4 h-16 w-16 text-charcoal/30" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
            />
          </svg>
          <p className="font-serif text-xl text-charcoal/60">
            Your generated notes will appear here
          </p>
          <p className="mt-2 text-sm text-charcoal/40">
            Enter your thoughts above and click Generate
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in rounded-[--radius-lg] bg-cream p-8 shadow-[--shadow-lg] transition-all duration-[--animate-duration-normal]">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-3xl text-charcoal">
          Your Aesthetic Notes
        </h2>
        <span className="rounded-[--radius-sm] bg-sage-green/20 px-3 py-1 text-sm font-medium text-sage-green">
          {format.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
        </span>
      </div>

      <div className="mb-6 rounded-[--radius-default] bg-almond-silk p-6 shadow-[--shadow-sm]">
        <div className="prose prose-charcoal max-w-none whitespace-pre-wrap font-sans text-charcoal/90 leading-relaxed">
          {output}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 rounded-[--radius-default] bg-sage-green px-6 py-3 font-medium text-cream shadow-[--shadow-sm] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-md] active:scale-95"
        >
          {copied ? (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy to Clipboard
            </>
          )}
        </button>

        <button
          onClick={handleDownload}
          className="flex items-center gap-2 rounded-[--radius-default] bg-soft-pink px-6 py-3 font-medium text-charcoal shadow-[--shadow-sm] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-md] active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download
        </button>

        <button
          className="flex items-center gap-2 rounded-[--radius-default] border-2 border-terracotta px-6 py-3 font-medium text-terracotta transition-all duration-[--animate-duration-fast] hover:bg-terracotta hover:text-cream hover:shadow-[--shadow-sm] active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </button>
      </div>
    </div>
  );
}
