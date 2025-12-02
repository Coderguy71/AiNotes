'use client';

import { useState } from 'react';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';

export function StudyActivityFeed() {
  const { state } = useStudyForge();
  const [isExporting, setIsExporting] = useState(false);

  if (!state) return null;

  const handleExportCSV = () => {
    try {
      setIsExporting(true);

      // Prepare CSV data
      const headers = ['Timestamp', 'Type', 'Message', 'XP Amount', 'Level'];
      const rows = state.activityLog.map((entry) => [
        new Date(entry.timestamp).toLocaleString(),
        entry.type,
        entry.message,
        entry.xpAmount?.toString() || '',
        entry.level?.toString() || '',
      ]);

      // Build CSV string with proper escaping
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => {
            // Escape quotes and wrap in quotes if contains comma or quote
            const escaped = cell.replace(/"/g, '""');
            return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
          }).join(',')
        ),
      ].join('\n');

      // Add UTF-8 BOM for Excel compatibility
      const bom = '\uFEFF';
      const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });

      // Trigger download
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `studyforge-activity-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'xp_earned':
        return '✨';
      case 'level_up':
        return '🎉';
      case 'upgrade_purchased':
        return '🛒';
      case 'mission_completed':
        return '✅';
      default:
        return '📌';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'xp_earned':
        return 'text-sage-green';
      case 'level_up':
        return 'text-terracotta';
      case 'upgrade_purchased':
        return 'text-dusty-mauve';
      case 'mission_completed':
        return 'text-soft-pink';
      default:
        return 'text-dim-grey';
    }
  };

  return (
    <div className="bg-cream rounded-lg p-6 border-2 border-almond-silk shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-serif text-charcoal">Activity Feed</h2>
        <button
          onClick={handleExportCSV}
          disabled={isExporting || state.activityLog.length === 0}
          className="px-3 py-2 bg-almond-silk text-charcoal rounded-lg text-sm font-semibold hover:bg-dusty-mauve hover:text-cream transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          title="Export activity log to CSV"
        >
          {isExporting ? (
            <span className="animate-breathing-spinner">⏳</span>
          ) : (
            <>
              <span>📊</span>
              <span className="hidden sm:inline">Export CSV</span>
            </>
          )}
        </button>
      </div>

      {/* Activity list */}
      {state.activityLog.length === 0 ? (
        <div className="text-center py-8 text-dim-grey">
          <p className="text-sm">No activity yet. Start earning XP!</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {state.activityLog.slice().reverse().map((entry, index) => (
            <div
              key={`${entry.timestamp}-${index}`}
              className="flex items-start gap-3 p-3 bg-almond-silk/20 rounded-lg hover:bg-almond-silk/30 transition-colors duration-200"
            >
              <span className={`text-xl ${getActivityColor(entry.type)}`} aria-hidden="true">
                {getActivityIcon(entry.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-charcoal leading-relaxed">
                  {entry.message}
                </p>
                <p className="text-xs text-dim-grey mt-1">
                  {new Date(entry.timestamp).toLocaleString()}
                </p>
              </div>
              {entry.xpAmount !== undefined && (
                <span className="text-sm font-semibold text-dusty-mauve whitespace-nowrap">
                  +{entry.xpAmount} XP
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
