'use client';

import { useEffect, useState } from 'react';
import {
  initStudyForge,
  getStudyForgeState,
  awardXP,
  purchaseUpgrade,
  claimMission,
  subscribeStudyForge,
  computeMultipliers,
  getXPForLevel,
  UPGRADES,
  type StudyForgeEvent,
} from '@/lib/studyForge';

export default function StudyForgeTestPage() {
  const [state, setState] = useState<ReturnType<typeof getStudyForgeState>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev].slice(0, 20));
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        addLog('Initializing StudyForge...');
        const initialState = await initStudyForge();
        setState(initialState);
        addLog(`Initialized! Level ${initialState.level}, ${initialState.totalXP} XP`);
        setIsLoading(false);
      } catch (error) {
        addLog(`Error initializing: ${error}`);
        setIsLoading(false);
      }
    };

    initialize();

    // Subscribe to events
    const unsubscribe = subscribeStudyForge((event: StudyForgeEvent) => {
      switch (event.type) {
        case 'xpAwarded':
          addLog(`✨ Earned ${event.effectiveXP} XP (${event.reason})`);
          break;
        case 'levelUp':
          addLog(`🎉 Level up! Now level ${event.newLevel}`);
          break;
        case 'upgradePurchased':
          addLog(`🛠️ Purchased: ${event.name}`);
          break;
        case 'missionCompleted':
          addLog(`✅ Mission claimed! +${event.reward} XP`);
          break;
        case 'settingsChanged':
          addLog('⚙️ Settings updated');
          break;
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshState = () => {
    const currentState = getStudyForgeState();
    setState(currentState);
  };

  const handleAwardXP = async (amount: number, reason: string, missionId?: string) => {
    try {
      const earned = await awardXP(amount, reason, missionId);
      addLog(`Awarded ${earned} XP`);
      refreshState();
    } catch (error) {
      addLog(`Error awarding XP: ${error}`);
    }
  };

  const handlePurchaseUpgrade = async (upgradeId: string) => {
    try {
      const success = await purchaseUpgrade(upgradeId);
      if (success) {
        addLog(`Successfully purchased upgrade: ${upgradeId}`);
        refreshState();
      } else {
        addLog(`Failed to purchase upgrade: ${upgradeId}`);
      }
    } catch (error) {
      addLog(`Error purchasing upgrade: ${error}`);
    }
  };

  const handleClaimMission = async (missionId: string) => {
    try {
      const reward = await claimMission(missionId);
      if (reward > 0) {
        addLog(`Claimed mission for ${reward} XP`);
        refreshState();
      } else {
        addLog(`Could not claim mission: ${missionId}`);
      }
    } catch (error) {
      addLog(`Error claiming mission: ${error}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dust-grey p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-serif text-charcoal mb-4">StudyForge Test Suite</h1>
          <p className="text-dim-grey">Loading...</p>
        </div>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen bg-dust-grey p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-serif text-charcoal mb-4">StudyForge Test Suite</h1>
          <p className="text-terracotta">Failed to initialize StudyForge</p>
        </div>
      </div>
    );
  }

  const multipliers = computeMultipliers(state.upgrades, state.dailyStreak);

  return (
    <div className="min-h-screen bg-dust-grey p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="bg-cream rounded-2xl p-6 shadow-md">
          <h1 className="text-3xl font-serif text-charcoal mb-2">StudyForge Test Suite</h1>
          <p className="text-dim-grey">Manual testing console for StudyForge core engine</p>
        </header>

        {/* State Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-cream rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-serif text-charcoal mb-4">Current State</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dim-grey">Level:</span>
                <span className="font-semibold text-charcoal">{state.level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">Total XP:</span>
                <span className="font-semibold text-charcoal">{state.totalXP}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">Available XP:</span>
                <span className="font-semibold text-sage-green">{state.availableXP}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">XP for Next Level:</span>
                <span className="font-semibold text-charcoal">{state.xpForNext}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">Progress:</span>
                <span className="font-semibold text-charcoal">
                  {(state.xpProgress * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">Passive XP/sec:</span>
                <span className="font-semibold text-dusty-mauve">{state.passiveXPPerSec}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">Pending Idle XP:</span>
                <span className="font-semibold text-terracotta">{state.pendingIdleXP}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">Daily Streak:</span>
                <span className="font-semibold text-charcoal">{state.dailyStreak}</span>
              </div>
            </div>
          </div>

          <div className="bg-cream rounded-2xl p-6 shadow-md">
            <h2 className="text-xl font-serif text-charcoal mb-4">Multipliers</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dim-grey">Base:</span>
                <span className="font-semibold text-charcoal">{multipliers.base.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">Upgrades:</span>
                <span className="font-semibold text-sage-green">
                  +{(multipliers.upgrades * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-dim-grey">Streak:</span>
                <span className="font-semibold text-terracotta">
                  +{(multipliers.streak * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between border-t border-almond-silk pt-2 mt-2">
                <span className="text-dim-grey font-semibold">Total:</span>
                <span className="font-bold text-dusty-mauve">{multipliers.total.toFixed(2)}x</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-almond-silk">
              <h3 className="text-sm font-semibold text-charcoal mb-2">XP Curve Reference</h3>
              <div className="space-y-1 text-xs text-dim-grey">
                {[1, 2, 3, 5, 10].map((level) => (
                  <div key={level} className="flex justify-between">
                    <span>Level {level}:</span>
                    <span>{getXPForLevel(level)} XP</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-cream rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-serif text-charcoal mb-4">Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button
              onClick={() => handleAwardXP(50, 'Created a note', 'create_notes')}
              className="px-4 py-2 bg-sage-green text-cream rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              +50 XP (Note)
            </button>
            <button
              onClick={() => handleAwardXP(30, 'Generated flashcards', 'generate_flashcards')}
              className="px-4 py-2 bg-dusty-mauve text-cream rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              +30 XP (Flashcards)
            </button>
            <button
              onClick={() => handleAwardXP(100, 'Test bonus XP')}
              className="px-4 py-2 bg-terracotta text-cream rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              +100 XP (Bonus)
            </button>
            <button
              onClick={refreshState}
              className="px-4 py-2 bg-charcoal text-cream rounded-lg hover:opacity-90 transition-opacity text-sm"
            >
              Refresh State
            </button>
          </div>
        </div>

        {/* Upgrades */}
        <div className="bg-cream rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-serif text-charcoal mb-4">Upgrades</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {UPGRADES.map((upgrade) => {
              const owned = state.upgrades[upgrade.id];
              const canAfford = state.availableXP >= upgrade.cost;
              const hasPrereqs =
                !upgrade.requires || upgrade.requires.every((reqId) => state.upgrades[reqId]);

              return (
                <div
                  key={upgrade.id}
                  className={`p-4 rounded-lg border-2 ${
                    owned
                      ? 'border-sage-green bg-sage-green/10'
                      : canAfford && hasPrereqs
                        ? 'border-dusty-mauve bg-cream'
                        : 'border-almond-silk bg-almond-silk/30'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-charcoal text-sm">{upgrade.name}</h3>
                    {owned && <span className="text-xs text-sage-green">✓ Owned</span>}
                  </div>
                  <p className="text-xs text-dim-grey mb-3">{upgrade.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-charcoal font-semibold">{upgrade.cost} XP</span>
                    {!owned && (
                      <button
                        onClick={() => handlePurchaseUpgrade(upgrade.id)}
                        disabled={!canAfford || !hasPrereqs}
                        className={`px-3 py-1 text-xs rounded ${
                          canAfford && hasPrereqs
                            ? 'bg-dusty-mauve text-cream hover:opacity-90'
                            : 'bg-almond-silk text-dim-grey cursor-not-allowed'
                        }`}
                      >
                        Purchase
                      </button>
                    )}
                  </div>
                  {!hasPrereqs && !owned && (
                    <p className="text-xs text-terracotta mt-2">Missing prerequisites</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Missions */}
        <div className="bg-cream rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-serif text-charcoal mb-4">Daily Missions</h2>
          <div className="space-y-3">
            {state.activeMissions.map((mission) => {
              const isComplete = mission.progress >= mission.target;
              const isClaimed = mission.claimed;

              return (
                <div
                  key={mission.id}
                  className={`p-4 rounded-lg border-2 ${
                    isClaimed
                      ? 'border-sage-green bg-sage-green/10'
                      : isComplete
                        ? 'border-dusty-mauve bg-cream'
                        : 'border-almond-silk bg-cream'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-charcoal text-sm">{mission.title}</h3>
                      <p className="text-xs text-dim-grey">{mission.description}</p>
                    </div>
                    {isClaimed && <span className="text-xs text-sage-green">✓ Claimed</span>}
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-dim-grey mb-1">
                        <span>
                          Progress: {mission.progress}/{mission.target}
                        </span>
                        <span>{mission.reward} XP</span>
                      </div>
                      <div className="w-full bg-almond-silk rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-sage-green h-full transition-all"
                          style={{ width: `${(mission.progress / mission.target) * 100}%` }}
                        />
                      </div>
                    </div>
                    {isComplete && !isClaimed && (
                      <button
                        onClick={() => handleClaimMission(mission.id)}
                        className="ml-4 px-3 py-1 text-xs bg-dusty-mauve text-cream rounded hover:opacity-90"
                      >
                        Claim
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-cream rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-serif text-charcoal mb-4">Activity Log</h2>
          <div className="space-y-2">
            {state.activityLog.length === 0 ? (
              <p className="text-sm text-dim-grey">No activity yet</p>
            ) : (
              state.activityLog.map((entry, index) => (
                <div key={index} className="text-xs text-dim-grey border-l-2 border-sage-green pl-3">
                  <span className="text-charcoal font-semibold">{entry.type}</span> -{' '}
                  {entry.message}
                  <span className="text-xs text-almond-silk ml-2">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Event Logs */}
        <div className="bg-cream rounded-2xl p-6 shadow-md">
          <h2 className="text-xl font-serif text-charcoal mb-4">Event Stream</h2>
          <div className="bg-charcoal rounded-lg p-4 font-mono text-xs text-cream max-h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-dim-grey">No events yet</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
