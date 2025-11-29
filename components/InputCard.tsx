"use client";

import { useState } from "react";

interface InputCardProps {
  onGenerate: (data: { input: string; format: string }) => Promise<void>;
  error?: string;
}

export default function InputCard({ onGenerate, error }: InputCardProps) {
  const [input, setInput] = useState("");
  const [format, setFormat] = useState("bullet-points");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return;
    
    setIsGenerating(true);
    try {
      await onGenerate({ input, format });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="animate-fade-in rounded-[--radius-lg] bg-cream p-4 sm:p-6 md:p-8 shadow-[--shadow-lg] hover-lift">
      <h2 className="mb-4 sm:mb-6 font-serif text-2xl sm:text-3xl bg-gradient-to-r from-charcoal to-sage-green bg-clip-text text-transparent">
        Your Thoughts
      </h2>
      
      <div className="space-y-4 sm:space-y-6">
        <div>
          <label 
            htmlFor="input-text" 
            className="mb-2 block text-sm font-medium text-charcoal/80"
          >
            Enter your notes or ideas
          </label>
          <textarea
            id="input-text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Start typing your thoughts..."
            className="w-full min-h-[140px] sm:min-h-[200px] md:min-h-[240px] rounded-[--radius-default] bg-almond-silk px-4 sm:px-6 py-3 sm:py-4 text-base text-charcoal shadow-[--shadow-sm] transition-all duration-[--animate-duration-fast] placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-dusty-mauve focus:shadow-[--shadow-md] resize-y"
            rows={5}
          />
        </div>

        <div>
          <label 
            htmlFor="format-select" 
            className="mb-2 block text-sm font-medium text-charcoal/80"
          >
            Output Format
          </label>
          <select
            id="format-select"
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full rounded-[--radius-default] bg-almond-silk px-4 sm:px-6 py-3.5 sm:py-3 text-base text-charcoal shadow-[--shadow-sm] transition-all duration-[--animate-duration-fast] focus:outline-none focus:ring-2 focus:ring-dusty-mauve focus:shadow-[--shadow-md] cursor-pointer min-h-[48px]"
          >
            <option value="bullet-points">Bullet Points</option>
            <option value="paragraph">Paragraph</option>
            <option value="checklist">Checklist</option>
            <option value="summary">Summary</option>
            <option value="outline">Outline</option>
          </select>
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-dust-grey via-dust-grey to-dust-grey/0 pt-8 sm:static sm:p-0 sm:bg-none sm:pt-0">
          <button
            onClick={handleGenerate}
            disabled={!input.trim() || isGenerating}
            className="w-full rounded-[--radius-default] bg-dusty-mauve px-6 sm:px-8 py-4 font-serif text-base sm:text-lg font-semibold text-cream shadow-[--shadow-lg] sm:shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-[1.02] hover:shadow-[--shadow-lg] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 min-h-[52px] touch-manipulation"
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-breathing-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </span>
            ) : (
              "Generate"
            )}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-[--radius-default] bg-terracotta/10 border-2 border-terracotta/30 p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-terracotta flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="font-semibold text-terracotta mb-1">Error</h3>
                <p className="text-sm text-charcoal/80">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
