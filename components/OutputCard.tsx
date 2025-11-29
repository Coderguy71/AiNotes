"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

interface OutputCardProps {
  output: string;
  format: string;
  isLoading?: boolean;
  onFormatChange?: (format: string) => void;
}

interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error";
  icon: React.ReactNode;
}

export default function OutputCard({ output, format, isLoading, onFormatChange }: OutputCardProps) {
  const [copied, setCopied] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const formatOptions = [
    { value: "bullet-points", label: "Bullet Points" },
    { value: "numbered-list", label: "Numbered List" },
    { value: "checklist", label: "Checklist" },
    { value: "summary", label: "Summary" },
    { value: "mindmap", label: "Mind Map" }
  ];

  const addToast = (message: string, type: "success" | "error", icon: React.ReactNode) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type, icon }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleCopy = async () => {
    if (!output) return;
    
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      addToast("Copied to clipboard!", "success", (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ));
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      addToast("Failed to copy", "error", (
        <svg className="h-5 w-5 animate-shake-error" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ));
    }
  };

  const handleDownloadPDF = async () => {
    if (!output || !contentRef.current) return;
    
    setPdfExporting(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = contentRef.current;
      const options = {
        margin: [0.75, 0.75, 0.75, 0.75] as [number, number, number, number],
        filename: `easynotes-${format}-${Date.now()}.pdf`,
        image: { type: 'jpeg' as const, quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, letterRendering: true },
        jsPDF: { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };
      
      await html2pdf().set(options).from(element).save();
      
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

  const handleShare = () => {
    addToast("Share feature coming soon!", "success", (
      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ));
  };

  const handleFormatChange = (newFormat: string) => {
    if (onFormatChange) {
      onFormatChange(newFormat);
      setShowFormatMenu(false);
      addToast("Format changed! Regenerate to see updates.", "success", (
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ));
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-[--radius-lg] bg-cream p-4 sm:p-6 md:p-8 shadow-[--shadow-lg] hover-lift">
        <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-sage-green to-soft-pink animate-breathing-spinner"></div>
            <h2 className="font-serif text-2xl sm:text-3xl bg-gradient-to-r from-charcoal to-dusty-mauve bg-clip-text text-transparent">
              Generating Your Notes
            </h2>
          </div>
          <div className="h-8 w-32 animate-shimmer rounded-[--radius-sm]"></div>
        </div>

        <div className="mb-6 rounded-[--radius-default] bg-almond-silk p-4 sm:p-6 shadow-[--shadow-sm]">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full animate-shimmer"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 animate-shimmer rounded w-full"></div>
                <div className="h-4 animate-shimmer rounded w-5/6"></div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full animate-shimmer"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 animate-shimmer rounded w-full"></div>
                <div className="h-4 animate-shimmer rounded w-4/6"></div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full animate-shimmer"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 animate-shimmer rounded w-full"></div>
                <div className="h-4 animate-shimmer rounded w-3/6"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="h-12 sm:h-14 flex-1 sm:flex-initial sm:w-48 animate-shimmer rounded-[--radius-default]"></div>
          <div className="h-12 sm:h-14 flex-1 sm:flex-initial sm:w-48 animate-shimmer rounded-[--radius-default]"></div>
          <div className="h-12 sm:h-14 flex-1 sm:flex-initial sm:w-32 animate-shimmer rounded-[--radius-default]"></div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-charcoal/60">
          <svg className="h-5 w-5 animate-breathing-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm">AI is creating your notes...</span>
        </div>
      </div>
    );
  }

  if (!output) {
    return (
      <div className="rounded-[--radius-lg] border-2 border-dashed border-charcoal/20 bg-cream/50 p-8 sm:p-12 text-center shadow-[--shadow-sm]">
        <div className="mx-auto max-w-md">
          <svg 
            className="mx-auto mb-4 h-12 sm:h-16 w-12 sm:w-16 text-charcoal/30 animate-float-gentle" 
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
          <p className="font-serif text-lg sm:text-xl text-charcoal/60">
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
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          key={output}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`rounded-[--radius-lg] bg-cream p-4 sm:p-6 md:p-8 shadow-[--shadow-lg] hover-lift ${showConfetti ? 'animate-celebratory-pulse' : ''}`}
        >
          <div className="mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <svg className="h-6 w-6 text-sage-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="font-serif text-2xl sm:text-3xl bg-gradient-to-r from-charcoal to-terracotta bg-clip-text text-transparent">
                  Your Notes
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-[--radius-sm] bg-sage-green/20 px-3 py-1.5 text-sm font-medium text-sage-green w-fit animate-pulse-glow">
                  {formatOptions.find(f => f.value === format)?.label || format}
                </span>
                {onFormatChange && (
                  <div className="relative">
                    <button
                      onClick={() => setShowFormatMenu(!showFormatMenu)}
                      className="group relative rounded-[--radius-sm] p-2 hover:bg-sage-green/10 transition-all duration-200 min-h-[40px] min-w-[40px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-sage-green/30"
                      aria-label="Change format"
                    >
                      <svg className="h-5 w-5 text-sage-green transition-transform group-hover:rotate-180 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="absolute -bottom-10 right-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-2 py-1 rounded whitespace-nowrap animate-tooltip-in z-10">
                        Change format
                      </span>
                    </button>
                    
                    <AnimatePresence>
                      {showFormatMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-12 z-20 w-48 rounded-[--radius-default] bg-cream shadow-[--shadow-xl] border-2 border-sage-green/20 overflow-hidden"
                        >
                          {formatOptions.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => handleFormatChange(option.value)}
                              className={`w-full text-left px-4 py-3 hover:bg-sage-green/10 transition-colors duration-200 ${
                                format === option.value ? 'bg-sage-green/20 font-medium text-sage-green' : 'text-charcoal'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {format === option.value && (
                                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                <span>{option.label}</span>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>
            
            <div className="h-px bg-gradient-to-r from-transparent via-sage-green/30 to-transparent"></div>
          </div>

          <motion.div 
            ref={contentRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="mb-4 sm:mb-6 rounded-[--radius-default] bg-almond-silk p-4 sm:p-6 shadow-[--shadow-sm]"
          >
            <div className="max-w-none font-sans text-base text-charcoal/90 leading-relaxed prose prose-charcoal">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="font-serif font-semibold text-2xl mt-4 mb-2 text-charcoal" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="font-serif font-semibold text-xl mt-4 mb-2 text-charcoal" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="font-serif font-semibold text-lg mt-4 mb-2 text-charcoal" {...props} />,
                  h4: ({ node, ...props }) => <h4 className="font-serif font-semibold text-base mt-4 mb-2 text-charcoal" {...props} />,
                  h5: ({ node, ...props }) => <h5 className="font-serif font-semibold text-sm mt-4 mb-2 text-charcoal" {...props} />,
                  h6: ({ node, ...props }) => <h6 className="font-serif font-semibold text-sm mt-4 mb-2 text-charcoal" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => (
                    <ul className="space-y-2 mb-4 list-disc marker:text-sage-green pl-6" {...props} />
                  ),
                  ol: ({ node, ...props }) => (
                    <ol className="space-y-2 mb-4 list-decimal marker:text-terracotta marker:font-semibold pl-6" {...props} />
                  ),
                  li: ({ node, children, ...props }) => (
                    <li className="leading-relaxed" {...props}>
                      {children}
                    </li>
                  ),
                  strong: ({ node, ...props }) => <strong className="font-semibold text-charcoal" {...props} />,
                  em: ({ node, ...props }) => <em className="italic" {...props} />,
                  code: ({ node, className, children, ...props }) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <code className="block bg-charcoal/5 rounded-[--radius-sm] p-4 my-3 text-sm font-mono overflow-x-auto" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="bg-charcoal/5 rounded px-1.5 py-0.5 text-sm font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ node, ...props }) => <pre className="my-3" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-sage-green pl-4 italic my-3 text-charcoal/70" {...props} />,
                  a: ({ node, ...props }) => <a className="text-sage-green hover:text-terracotta underline transition-colors" {...props} />,
                  hr: ({ node, ...props }) => <hr className="my-4 border-t border-charcoal/20" {...props} />,
                }}
              >
                {output}
              </ReactMarkdown>
            </div>
          </motion.div>

          <div className="h-px bg-gradient-to-r from-transparent via-terracotta/30 to-transparent mb-4"></div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              onClick={handleCopy}
              disabled={copied}
              className="group relative flex items-center justify-center gap-2 rounded-[--radius-default] bg-gradient-to-br from-sage-green to-sage-green/80 px-5 sm:px-6 py-3.5 font-medium text-cream shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-lg] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-sage-green/50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
            >
              {copied ? (
                <>
                  <svg className="h-5 w-5 animate-confetti-pop" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span className="whitespace-nowrap">Copy to Clipboard</span>
                </>
              )}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-3 py-1.5 rounded whitespace-nowrap animate-tooltip-in z-10">
                Copy notes as text
              </span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={pdfExporting}
              className="group relative flex items-center justify-center gap-2 rounded-[--radius-default] bg-gradient-to-br from-soft-pink to-soft-pink/80 px-5 sm:px-6 py-3.5 font-medium text-charcoal shadow-[--shadow-md] transition-all duration-[--animate-duration-fast] hover:scale-105 hover:shadow-[--shadow-lg] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-soft-pink/50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[48px] touch-manipulation"
            >
              {pdfExporting ? (
                <>
                  <svg className="h-5 w-5 animate-breathing-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="whitespace-nowrap">Download PDF</span>
                </>
              )}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-3 py-1.5 rounded whitespace-nowrap animate-tooltip-in z-10">
                Export as PDF file
              </span>
            </button>

            <button
              onClick={handleShare}
              className="group relative flex items-center justify-center gap-2 rounded-[--radius-default] border-2 border-terracotta bg-transparent px-5 sm:px-6 py-3.5 font-medium text-terracotta transition-all duration-[--animate-duration-fast] hover:bg-terracotta hover:text-cream hover:shadow-[--shadow-md] hover:-translate-y-0.5 active:scale-95 focus:outline-none focus:ring-2 focus:ring-terracotta/50 min-h-[48px] touch-manipulation"
            >
              <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 group-focus:opacity-100 pointer-events-none transition-opacity duration-200 bg-charcoal text-cream text-xs px-3 py-1.5 rounded whitespace-nowrap animate-tooltip-in z-10">
                Share your notes
              </span>
            </button>
          </div>

          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[--radius-lg]">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-confetti-pop"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.3}s`,
                  }}
                >
                  <div 
                    className="h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: ['#a8b5a0', '#d97d62', '#e8c5c1', '#b89faa'][Math.floor(Math.random() * 4)]
                    }}
                  ></div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div className="fixed top-20 right-4 z-50 space-y-2">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.3 }}
              className={`flex items-center gap-3 rounded-[--radius-default] px-4 py-3 shadow-[--shadow-xl] min-w-[250px] ${
                toast.type === 'success' 
                  ? 'bg-sage-green text-cream' 
                  : 'bg-terracotta text-cream'
              }`}
            >
              {toast.icon}
              <span className="font-medium text-sm">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {showFormatMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setShowFormatMenu(false)}
        />
      )}
    </div>
  );
}
