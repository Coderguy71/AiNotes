"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getNotes, deleteNote, NoteRecord } from "@/lib/db";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function Dashboard() {
  const [notes, setNotes] = useState<NoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNoteId, setExpandedNoteId] = useState<number | null>(null);
  const [deletingNoteId, setDeletingNoteId] = useState<number | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const allNotes = await getNotes();
      setNotes(allNotes || []);
    } catch (error) {
      console.error("Failed to load notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this note?")) {
      return;
    }

    setDeletingNoteId(id);
    try {
      await deleteNote(id);
      await loadNotes();
    } catch (error) {
      console.error("Failed to delete note:", error);
      alert("Failed to delete note. Please try again.");
    } finally {
      setDeletingNoteId(null);
    }
  };

  const toggleExpanded = (id: number) => {
    setExpandedNoteId(expandedNoteId === id ? null : id);
  };

  // Calculate analytics
  const subjectData = notes.reduce((acc, note) => {
    acc[note.subject] = (acc[note.subject] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const difficultyData = notes.reduce(
    (acc, note) => {
      acc[note.difficulty] = (acc[note.difficulty] || 0) + 1;
      return acc;
    },
    { beginner: 0, intermediate: 0, advanced: 0 } as Record<string, number>
  );

  const tagData = notes.reduce((acc, note) => {
    note.tags.forEach((tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  // Format data for charts
  const subjectChartData = Object.entries(subjectData).map(([name, value]) => ({
    name,
    value,
  }));

  const difficultyChartData = [
    { name: "Beginner", value: difficultyData.beginner },
    { name: "Intermediate", value: difficultyData.intermediate },
    { name: "Advanced", value: difficultyData.advanced },
  ];

  // Get most common tags (top 10)
  const topTags = Object.entries(tagData)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Calculate weak spots
  const leastStudiedSubjects = Object.entries(subjectData)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 2);

  // Calculate hardest difficulty by subject
  const subjectDifficulty = notes.reduce((acc, note) => {
    if (!acc[note.subject]) {
      acc[note.subject] = { beginner: 0, intermediate: 0, advanced: 0, total: 0 };
    }
    acc[note.subject][note.difficulty]++;
    acc[note.subject].total++;
    return acc;
  }, {} as Record<string, { beginner: number; intermediate: number; advanced: number; total: number }>);

  const hardestSubjects = Object.entries(subjectDifficulty)
    .map(([subject, counts]) => {
      const avgDifficulty =
        (counts.beginner * 1 + counts.intermediate * 2 + counts.advanced * 3) / counts.total;
      return { subject, avgDifficulty, total: counts.total };
    })
    .sort((a, b) => b.avgDifficulty - a.avgDifficulty)
    .slice(0, 2);

  // Chart colors matching brand palette
  const COLORS = ["#a8b5a0", "#d97d62", "#e8c5c1", "#b89faa", "#f7f1e8", "#3e3e3e"];
  const DIFFICULTY_COLORS = {
    Beginner: "#a8b5a0",
    Intermediate: "#d97d62",
    Advanced: "#b89faa",
  };

  // Get latest 5 notes
  const recentNotes = notes.slice(0, 5);

  if (isLoading) {
    return (
      <div className="min-h-screen relative">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8 animate-fade-in">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal mb-2">
              Your Dashboard
            </h2>
            <p className="text-charcoal/70">Loading your study insights...</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-6 shadow-[--shadow-default] animate-shimmer"
              >
                <div className="h-8 w-48 bg-almond-silk rounded mb-4"></div>
                <div className="h-64 bg-almond-silk rounded"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="min-h-screen relative">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative z-10">
          <div className="mb-8 animate-fade-in">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal mb-2">
              Your Dashboard
            </h2>
            <p className="text-charcoal/70">Track your learning journey and insights</p>
          </div>

          <div className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-12 shadow-[--shadow-default] text-center animate-fade-in-scale">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-sage-green/20 to-soft-pink/20 mb-6 animate-float-gentle">
              <svg
                className="h-10 w-10 text-sage-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="font-serif text-2xl font-semibold text-charcoal mb-3">
              No notes yet
            </h3>
            <p className="text-charcoal/60 mb-6 max-w-md mx-auto">
              Start creating notes to see your study breakdown, track your progress, and identify
              areas for improvement.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-sage-green to-soft-pink text-cream font-medium rounded-[--radius-default] hover-lift shadow-[--shadow-default] transition-all duration-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create Your First Note
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 animate-fade-in">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-charcoal mb-2">
            Your Dashboard
          </h2>
          <p className="text-charcoal/70">
            Track your learning journey • {notes.length} total note{notes.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Section A: Study Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Subject Frequency Pie Chart */}
          <div
            className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-6 shadow-[--shadow-default] hover-lift transition-all duration-300 animate-stagger-1"
            style={{ animationDelay: "0s" }}
          >
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg
                className="h-6 w-6 text-sage-green"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                />
              </svg>
              Subject Frequency
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={subjectChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subjectChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Difficulty Distribution Bar Chart */}
          <div
            className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-6 shadow-[--shadow-default] hover-lift transition-all duration-300 animate-stagger-2"
            style={{ animationDelay: "0.1s" }}
          >
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg
                className="h-6 w-6 text-terracotta"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Difficulty Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={difficultyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#3e3e3e20" />
                <XAxis dataKey="name" stroke="#3e3e3e" />
                <YAxis stroke="#3e3e3e" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#faf8f5",
                    border: "1px solid #3e3e3e20",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {difficultyChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={DIFFICULTY_COLORS[entry.name as keyof typeof DIFFICULTY_COLORS]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Section B: Recent Notes */}
        <div
          className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-6 shadow-[--shadow-default] mb-6 animate-stagger-3"
          style={{ animationDelay: "0.2s" }}
        >
          <h3 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal mb-4 flex items-center gap-2">
            <svg
              className="h-6 w-6 text-dusty-mauve"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Recent Notes
          </h3>
          <div className="space-y-3">
            {recentNotes.map((note) => {
              const isExpanded = expandedNoteId === note.id;
              const isDeleting = deletingNoteId === note.id;
              const date = new Date(note.timestamp);

              return (
                <div
                  key={note.id}
                  className="bg-almond-silk rounded-[--radius-default] p-4 border border-charcoal/10 hover:border-sage-green/30 transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage-green/20 text-charcoal border border-sage-green/30">
                          {note.subject}
                        </span>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            note.difficulty === "beginner"
                              ? "bg-sage-green/20 border-sage-green/30"
                              : note.difficulty === "intermediate"
                              ? "bg-terracotta/20 border-terracotta/30"
                              : "bg-dusty-mauve/20 border-dusty-mauve/30"
                          } text-charcoal`}
                        >
                          {note.difficulty}
                        </span>
                        <span className="text-xs text-charcoal/50">
                          {date.toLocaleDateString()} • {date.toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-sm text-charcoal/80 font-medium mb-1">{note.topic}</p>
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-charcoal/10 animate-slide-in-down">
                          <div className="mb-2">
                            <p className="text-xs font-semibold text-charcoal/60 uppercase tracking-wide mb-1">
                              Original Input:
                            </p>
                            <p className="text-sm text-charcoal/70 line-clamp-3">
                              {note.rawText}
                            </p>
                          </div>
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {note.tags.map((tag, i) => (
                                <span
                                  key={i}
                                  className="text-xs px-2 py-0.5 bg-soft-pink/20 text-charcoal/70 rounded border border-soft-pink/30"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpanded(note.id!)}
                        className="flex items-center justify-center h-8 w-8 rounded-[--radius-sm] bg-sage-green/10 hover:bg-sage-green/20 text-sage-green transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-sage-green/50"
                        aria-label={isExpanded ? "Collapse details" : "Expand details"}
                        aria-expanded={isExpanded}
                      >
                        <svg
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(note.id!)}
                        disabled={isDeleting}
                        className="flex items-center justify-center h-8 w-8 rounded-[--radius-sm] bg-terracotta/10 hover:bg-terracotta/20 text-terracotta transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-terracotta/50 disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Delete note"
                      >
                        {isDeleting ? (
                          <svg
                            className="h-4 w-4 animate-spin"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        ) : (
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {notes.length > 5 && (
            <p className="text-sm text-charcoal/60 mt-4 text-center">
              Showing latest 5 of {notes.length} notes
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section C: Most Common Tags */}
          <div
            className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-6 shadow-[--shadow-default] hover-lift transition-all duration-300 animate-stagger-1"
            style={{ animationDelay: "0.3s" }}
          >
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg
                className="h-6 w-6 text-soft-pink"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              Most Common Tags
            </h3>
            {topTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {topTags.map(([tag, count]) => {
                  const maxCount = topTags[0][1];
                  const minCount = topTags[topTags.length - 1][1];
                  const range = maxCount - minCount;
                  const normalized = range > 0 ? (count - minCount) / range : 1;
                  const fontSize = 0.75 + normalized * 0.75;
                  const opacity = 0.6 + normalized * 0.4;

                  return (
                    <span
                      key={tag}
                      className="inline-block px-3 py-1.5 bg-gradient-to-r from-sage-green/10 to-soft-pink/10 text-charcoal rounded-[--radius-default] border border-sage-green/20 hover:border-sage-green/40 transition-all duration-200 hover:scale-105 cursor-default"
                      style={{
                        fontSize: `${fontSize}rem`,
                        opacity,
                      }}
                      title={`Used ${count} time${count !== 1 ? "s" : ""}`}
                    >
                      #{tag}
                      <span className="ml-1.5 text-xs text-charcoal/50">({count})</span>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-charcoal/60 text-sm">No tags yet</p>
            )}
          </div>

          {/* Section D: Weak Spots */}
          <div
            className="bg-cream/80 backdrop-blur-sm rounded-[--radius-default] p-6 shadow-[--shadow-default] hover-lift transition-all duration-300 animate-stagger-2"
            style={{ animationDelay: "0.4s" }}
          >
            <h3 className="font-serif text-xl sm:text-2xl font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg
                className="h-6 w-6 text-terracotta"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              Your Weak Spots
            </h3>
            <div className="space-y-4">
              {leastStudiedSubjects.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-charcoal/70 mb-2">
                    📚 Least Studied Subjects:
                  </p>
                  <div className="space-y-2">
                    {leastStudiedSubjects.map(([subject, count]) => (
                      <div
                        key={subject}
                        className="flex items-center justify-between p-3 bg-terracotta/10 rounded-[--radius-sm] border border-terracotta/20"
                      >
                        <span className="text-sm font-medium text-charcoal">{subject}</span>
                        <span className="text-xs px-2 py-1 bg-cream rounded text-charcoal/70">
                          {count} note{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-charcoal/60 mt-2 italic">
                    💡 Consider creating more notes in these subjects to deepen your understanding.
                  </p>
                </div>
              )}

              {hardestSubjects.length > 0 && hardestSubjects[0].total >= 2 && (
                <div>
                  <p className="text-sm font-semibold text-charcoal/70 mb-2">
                    🔥 Highest Difficulty Subjects:
                  </p>
                  <div className="space-y-2">
                    {hardestSubjects.map(({ subject, avgDifficulty, total }) => (
                      <div
                        key={subject}
                        className="flex items-center justify-between p-3 bg-dusty-mauve/10 rounded-[--radius-sm] border border-dusty-mauve/20"
                      >
                        <span className="text-sm font-medium text-charcoal">{subject}</span>
                        <span className="text-xs px-2 py-1 bg-cream rounded text-charcoal/70">
                          Avg: {avgDifficulty.toFixed(1)}/3
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-charcoal/60 mt-2 italic">
                    💡 These subjects have the highest average difficulty. Review and reinforce
                    fundamentals.
                  </p>
                </div>
              )}

              {leastStudiedSubjects.length === 0 && hardestSubjects.length === 0 && (
                <div className="text-center py-6">
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-sage-green/20 mb-3">
                    <svg
                      className="h-6 w-6 text-sage-green"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <p className="text-sm text-charcoal/70">
                    Great job! Keep up the balanced learning.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-dust-grey/80 border-b border-charcoal/10 shadow-[--shadow-sm]">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 sm:gap-3 group"
          >
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-[--radius-sm] bg-gradient-to-br from-sage-green to-soft-pink shadow-[--shadow-sm] group-hover:scale-105 transition-transform duration-300">
              <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-cream"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <h1 className="font-serif text-xl font-semibold bg-gradient-to-r from-charcoal via-sage-green/80 to-charcoal bg-clip-text text-transparent sm:text-3xl md:text-4xl">
              EasyNotesAI
            </h1>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-charcoal hover:text-sage-green transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sage-green/50 rounded-[--radius-sm]"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span className="hidden sm:inline">Back to Home</span>
              <span className="sm:hidden">Home</span>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
