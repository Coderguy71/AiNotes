"use client";

import { useState } from "react";

interface InputCardProps {
  onGenerate: (data: { input: string; format: string }) => Promise<void>;
}

export default function InputCard({ onGenerate }: InputCardProps) {
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
    <div className="animate-fade-in rounded-[--radius-lg] bg-cream p-8 shadow-[--shadow-lg] transition-all duration-[--animate-duration-normal] hover:shadow-[--shadow-xl]">
      <h2 className="mb-6 font-serif text-3xl text-charcoal">
        Your Thoughts
      </h2>
      
      <div className="space-y-6">
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
            className="w-full rounded-[--radius-default] bg-almond-silk px-6 py-4 text-charcoal shadow-[--shadow-sm] transition-all duration-[--animate-duration-fast] placeholder:text-charcoal/40 focus:outline-none focus:ring-2 focus:ring-dusty-mauve focus:shadow-[--shadow-md]"
            rows={8}
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
            className="w-full rounded-[--radius-default] bg-almond-silk px-6 py-3 text-charcoal shadow-[--shadow-sm] transition-all duration-[--animate-duration-fast] focus:outline-none focus:ring-2 focus:ring-dusty-mauve focus:shadow-[--shadow-md] cursor-pointer"
          >
            <option value="bullet-points">Bullet Points</option>
            <option value="paragraph">Paragraph</option>
            <option value="checklist">Checklist</option>
            <option value="summary">Summary</option>
            <option value="outline">Outline</option>
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!input.trim() || isGenerating}
          className="w-full rounded-[--radius-default] bg-dusty-mauve px-8 py-4 font-serif text-lg font-semibold text-cream shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-[1.02] hover:shadow-[--shadow-lg] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="h-5 w-5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
    </div>
  );
}
