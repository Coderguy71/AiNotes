"use client";

import { useState, useRef, useEffect } from "react";

interface InputCardProps {
  onGenerate: (data: { input: string }) => Promise<void>;
  error?: string;
  format: string;
  onFormatChange: (format: string) => void;
}

const SAMPLE_TEXT = `Meeting Notes - Project Kickoff
- Discussed project timeline and key milestones
- Team introductions and role assignments
- Budget approval pending executive review
- Next steps: create detailed project plan
- Schedule follow-up meeting for next week`;

export default function InputCard({ onGenerate, error, format, onFormatChange }: InputCardProps) {
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [isClearing, setIsClearing] = useState(false);
  const [showFormatTip, setShowFormatTip] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const prevErrorRef = useRef<string | undefined>(undefined);

  // Show format tip when user generates output
  useEffect(() => {
    if (!error && isGenerating === false && prevErrorRef.current === undefined) {
      setShowFormatTip(true);
    }
    prevErrorRef.current = error;
  }, [isGenerating, error]);

  const handleGenerate = async () => {
    if (!input.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setShowFormatTip(false);
    try {
      await onGenerate({ input });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClearAll = () => {
    setIsClearing(true);
    setInput("");
    setShowFormatTip(false);
    setTimeout(() => {
      setIsClearing(false);
      textareaRef.current?.focus();
    }, 300);
  };

  const handleLoadSample = () => {
    setInput(SAMPLE_TEXT);
    setShowFormatTip(false);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  };

  return (
    <div className="animate-fade-in rounded-[--radius-lg] bg-cream p-4 sm:p-6 md:p-8 shadow-[--shadow-lg] hover-lift">
      <div className="flex items-start justify-between mb-4 sm:mb-6">
        <h2 className="font-serif text-2xl sm:text-3xl bg-gradient-to-r from-charcoal to-sage-green bg-clip-text text-transparent">
          Your Thoughts
        </h2>
        
        <div className="flex items-center gap-2">
          {/* Load Sample Button */}
          <div className="relative">
            <button
              type="button"
              onClick={handleLoadSample}
              onMouseEnter={() => setShowTooltip('sample')}
              onMouseLeave={() => setShowTooltip(null)}
              className="p-2 rounded-[--radius-sm] bg-sage-green/10 hover:bg-sage-green/20 text-sage-green transition-all duration-200 hover:scale-110 active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation"
              aria-label="Load sample text"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
            {showTooltip === 'sample' && (
              <div className="absolute top-full mt-2 right-0 z-50 px-3 py-2 text-xs font-medium text-cream bg-charcoal rounded-[--radius-sm] shadow-[--shadow-md] whitespace-nowrap animate-tooltip-in">
                Load demo content
                <div className="absolute -top-1 right-4 w-2 h-2 bg-charcoal transform rotate-45"></div>
              </div>
            )}
          </div>

          {/* Clear All Button */}
          <div className="relative">
            <button
              type="button"
              onClick={handleClearAll}
              onMouseEnter={() => setShowTooltip('clear')}
              onMouseLeave={() => setShowTooltip(null)}
              disabled={!input.trim()}
              className={`p-2 rounded-[--radius-sm] transition-all duration-200 hover:scale-110 active:scale-95 min-h-[40px] min-w-[40px] flex items-center justify-center touch-manipulation ${
                input.trim() 
                  ? 'bg-terracotta/10 hover:bg-terracotta/20 text-terracotta' 
                  : 'bg-charcoal/5 text-charcoal/30 cursor-not-allowed'
              } ${isClearing ? 'animate-clear-pulse' : ''}`}
              aria-label="Clear all text"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            {showTooltip === 'clear' && input.trim() && (
              <div className="absolute top-full mt-2 right-0 z-50 px-3 py-2 text-xs font-medium text-cream bg-charcoal rounded-[--radius-sm] shadow-[--shadow-md] whitespace-nowrap animate-tooltip-in">
                Clear all
                <div className="absolute -top-1 right-4 w-2 h-2 bg-charcoal transform rotate-45"></div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="space-y-4 sm:space-y-6">
        {/* Textarea with floating label effect */}
        <div className="relative">
          <label 
            htmlFor="input-text" 
            className={`absolute left-4 sm:left-6 transition-all duration-300 pointer-events-none z-10 ${
              isFocused || input 
                ? '-top-2.5 text-xs bg-cream px-2 rounded-sm text-dusty-mauve font-semibold' 
                : 'top-3 sm:top-4 text-sm text-charcoal/60'
            }`}
          >
            {isFocused || input ? 'Your Notes' : 'Enter your notes or ideas'}
          </label>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="input-text"
              value={input}
              onChange={handleTextareaChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFocused ? "Start typing your thoughts..." : ""}
              className={`w-full min-h-[140px] sm:min-h-[200px] md:min-h-[240px] rounded-[--radius-default] bg-almond-silk px-4 sm:px-6 py-3 sm:py-4 text-base text-charcoal shadow-[--shadow-sm] transition-all duration-300 placeholder:text-charcoal/40 focus:outline-none resize-y ${
                isFocused 
                  ? 'ring-2 ring-dusty-mauve shadow-[--shadow-md] scale-[1.01]' 
                  : 'ring-0'
              }`}
              rows={5}
              style={{ transition: 'height 0.2s ease' }}
            />
            {/* Animated underline */}
            <div className={`absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-dusty-mauve to-soft-pink transition-all duration-300 ${
              isFocused ? 'w-full' : 'w-0'
            }`}></div>
          </div>
        </div>

        {/* Format selector with animated chevron */}
        <div className="relative">
          <label 
            htmlFor="format-select" 
            className="mb-2 block text-sm font-medium text-charcoal/80"
          >
            Output Format
          </label>
          <div className="relative">
            <select
              id="format-select"
              value={format}
              onChange={(e) => {
                onFormatChange(e.target.value);
                setShowFormatTip(false);
              }}
              className="w-full rounded-[--radius-default] bg-almond-silk px-4 sm:px-6 py-3.5 sm:py-3 text-base text-charcoal shadow-[--shadow-sm] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-dusty-mauve focus:shadow-[--shadow-md] focus:scale-[1.01] cursor-pointer min-h-[48px] appearance-none pr-12"
            >
              <option value="bullet-points">Bullet Points</option>
              <option value="paragraph">Paragraph</option>
              <option value="checklist">Checklist</option>
              <option value="summary">Summary</option>
              <option value="outline">Outline</option>
            </select>
            {/* Custom animated chevron */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal/60 transition-transform duration-200">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          
          {/* Format change tip */}
          {showFormatTip && (
            <div className="mt-3 flex items-start gap-2 p-3 rounded-[--radius-sm] bg-sage-green/10 border border-sage-green/20 animate-slide-in-down">
              <svg className="h-5 w-5 text-sage-green flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-charcoal/80">
                <strong className="text-sage-green">Tip:</strong> You can change the format anytime without retyping your notes!
              </p>
              <button
                onClick={() => setShowFormatTip(false)}
                className="ml-auto text-charcoal/40 hover:text-charcoal/60 transition-colors"
                aria-label="Dismiss tip"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Generate button with enhanced states */}
        <div className="fixed bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-dust-grey via-dust-grey to-dust-grey/0 pt-8 sm:static sm:p-0 sm:bg-none sm:pt-0">
          <button
            onClick={handleGenerate}
            disabled={!input.trim() || isGenerating}
            className="w-full rounded-[--radius-default] bg-dusty-mauve px-6 sm:px-8 py-4 font-serif text-base sm:text-lg font-semibold text-cream shadow-[--shadow-lg] sm:shadow-[--shadow-md] transition-all duration-300 hover:scale-[1.02] hover:shadow-[--shadow-xl] hover:-translate-y-1 active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:translate-y-0 min-h-[52px] touch-manipulation"
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
              <span className="flex items-center justify-center gap-2">
                Generate
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </span>
            )}
          </button>
        </div>

        {/* Error message with animated icon */}
        {error && (
          <div className="mt-4 rounded-[--radius-default] bg-terracotta/10 border-2 border-terracotta/30 p-4 animate-fade-in">
            <div className="flex items-start gap-3">
              <svg 
                className="h-5 w-5 text-terracotta flex-shrink-0 mt-0.5 animate-shake-error" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
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
