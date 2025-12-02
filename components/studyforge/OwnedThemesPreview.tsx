'use client';

import { useStudyForge } from '@/components/providers/StudyForgeProvider';
import { updateSettings } from '@/lib/studyForge';

export function OwnedThemesPreview() {
  const { state, refreshState } = useStudyForge();

  if (!state) return null;

  const handleThemeSelect = async (theme: string) => {
    try {
      await updateSettings({ ...state.settings, theme });
      await refreshState();
    } catch (error) {
      console.error('Failed to change theme:', error);
    }
  };

  const themes = [
    {
      id: 'default',
      name: 'Default Light',
      colors: ['#faf8f5', '#a8b5a0', '#d97d62'],
      description: 'Classic cream and sage',
    },
    {
      id: 'mindforge_dark',
      name: 'Mindforge Dark',
      colors: ['#2c2c2c', '#565264', '#a6808c'],
      description: 'Sleek dark mode',
    },
  ];

  return (
    <div className="bg-cream rounded-lg p-6 border-2 border-almond-silk shadow-md">
      <h2 className="text-xl font-serif text-charcoal mb-4">Themes</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map((theme) => {
          const isOwned = state.ownedThemes.includes(theme.id);
          const isActive = state.settings.theme === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => isOwned && handleThemeSelect(theme.id)}
              disabled={!isOwned}
              className={`
                relative text-left p-4 rounded-lg border-2
                transition-all duration-200
                ${
                  isActive
                    ? 'border-dusty-mauve shadow-md'
                    : isOwned
                    ? 'border-almond-silk hover:border-dusty-mauve hover:shadow-md'
                    : 'border-dim-grey/30 opacity-50 cursor-not-allowed'
                }
              `}
            >
              {/* Active badge */}
              {isActive && (
                <div className="absolute top-2 right-2 bg-dusty-mauve text-cream text-xs font-semibold px-2 py-1 rounded-full">
                  Active
                </div>
              )}

              {/* Locked badge */}
              {!isOwned && (
                <div className="absolute top-2 right-2 bg-dim-grey text-cream text-xs font-semibold px-2 py-1 rounded-full">
                  🔒 Locked
                </div>
              )}

              {/* Color swatches */}
              <div className="flex gap-2 mb-3">
                {theme.colors.map((color, index) => (
                  <div
                    key={index}
                    className="w-8 h-8 rounded-full border-2 border-charcoal/20"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>

              {/* Theme info */}
              <h3 className="font-semibold text-charcoal text-sm mb-1">
                {theme.name}
              </h3>
              <p className="text-xs text-dim-grey">
                {theme.description}
              </p>
            </button>
          );
        })}
      </div>

      {state.ownedThemes.length < themes.length && (
        <p className="text-xs text-dim-grey mt-4 text-center">
          Unlock more themes by purchasing upgrades in the shop!
        </p>
      )}
    </div>
  );
}
