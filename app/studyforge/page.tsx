'use client';

import Link from 'next/link';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';
import { StudyForgeHeader } from '@/components/studyforge/StudyForgeHeader';
import { StudyForgeShop } from '@/components/studyforge/StudyForgeShop';
import { MissionCard } from '@/components/studyforge/MissionCard';
import { OwnedThemesPreview } from '@/components/studyforge/OwnedThemesPreview';
import { StudyActivityFeed } from '@/components/studyforge/StudyActivityFeed';

export default function StudyForgePage() {
  const { state, isLoading, error } = useStudyForge();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header skeleton */}
          <div className="bg-cream rounded-xl p-6 border-2 border-almond-silk animate-shimmer">
            <div className="h-20 bg-almond-silk/30 rounded-lg" />
          </div>

          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-cream rounded-lg p-6 border-2 border-almond-silk animate-shimmer">
                <div className="h-64 bg-almond-silk/30 rounded-lg" />
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-cream rounded-lg p-6 border-2 border-almond-silk animate-shimmer">
                <div className="h-64 bg-almond-silk/30 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !state) {
    return (
      <div className="min-h-screen p-4 sm:p-6 md:p-8 flex items-center justify-center">
        <div className="max-w-md w-full bg-cream rounded-xl p-8 border-2 border-terracotta shadow-lg text-center space-y-4">
          <div className="text-6xl animate-shake-error">⚠️</div>
          <h1 className="text-2xl font-serif text-charcoal">
            Unable to Load StudyForge
          </h1>
          <p className="text-dim-grey">
            {error || 'Something went wrong. Please try refreshing the page.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-terracotta to-dusty-mauve text-cream rounded-lg font-semibold hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <nav className="flex items-center gap-4 text-sm">
          <Link
            href="/"
            className="text-dim-grey hover:text-charcoal transition-colors duration-200 flex items-center gap-2"
          >
            <span>🏠</span>
            <span>Home</span>
          </Link>
          <span className="text-dim-grey">/</span>
          <Link
            href="/dashboard"
            className="text-dim-grey hover:text-charcoal transition-colors duration-200 flex items-center gap-2"
          >
            <span>📊</span>
            <span>Dashboard</span>
          </Link>
          <span className="text-dim-grey">/</span>
          <span className="text-charcoal font-semibold">StudyForge</span>
        </nav>

        {/* Header */}
        <StudyForgeHeader />

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Shop and Missions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Daily Missions */}
            <div className="bg-cream rounded-lg p-6 border-2 border-almond-silk shadow-md">
              <h2 className="text-2xl font-serif text-charcoal mb-6">Daily Missions</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {state.activeMissions.map((mission) => (
                  <MissionCard key={mission.id} mission={mission} />
                ))}
              </div>

              <p className="text-xs text-dim-grey mt-4 text-center">
                Missions reset daily at midnight
              </p>
            </div>

            {/* Shop */}
            <StudyForgeShop />
          </div>

          {/* Right column: Themes and Activity */}
          <div className="space-y-6">
            {/* Themes */}
            <OwnedThemesPreview />

            {/* Activity Feed */}
            <StudyActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
