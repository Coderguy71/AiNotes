'use client';

import { useState } from 'react';
import { purchaseUpgrade, canPurchaseUpgrade, type UpgradeDefinition } from '@/lib/studyForge';
import { useStudyForge } from '@/components/providers/StudyForgeProvider';

interface UpgradeCardProps {
  upgrade: UpgradeDefinition;
}

export function UpgradeCard({ upgrade }: UpgradeCardProps) {
  const { state, refreshState } = useStudyForge();
  const [isPurchasing, setIsPurchasing] = useState(false);

  if (!state) return null;

  const isOwned = state.upgrades[upgrade.id] === true;
  const canPurchase = canPurchaseUpgrade(upgrade.id);
  const canAfford = state.availableXP >= upgrade.cost;

  const handlePurchase = async () => {
    if (isPurchasing || isOwned || !canPurchase) return;

    try {
      setIsPurchasing(true);
      await purchaseUpgrade(upgrade.id);
      await refreshState();
    } catch (error) {
      console.error('Failed to purchase upgrade:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const getEffectText = () => {
    switch (upgrade.effect.type) {
      case 'multiplier':
        return `+${((upgrade.effect.value || 0) * 100).toFixed(0)}% XP`;
      case 'passive_xp':
        return `+${upgrade.effect.value} XP/sec`;
      case 'theme':
        return 'Unlock theme';
      case 'auto_collect':
        return 'Auto-collect idle XP';
      default:
        return '';
    }
  };

  const getRequirementText = () => {
    if (!upgrade.requires || upgrade.requires.length === 0) return null;
    return upgrade.requires.map((reqId) => {
      const reqUpgrade = state.upgrades[reqId];
      return reqUpgrade ? '✓' : '✗';
    }).join(' ');
  };

  return (
    <div
      className={`
        relative group
        bg-cream rounded-lg p-6
        border-2
        transition-all duration-200
        ${isOwned ? 'border-sage-green shadow-md' : 'border-almond-silk hover:border-dusty-mauve'}
        ${!canPurchase || !canAfford ? 'opacity-60' : 'hover:shadow-lg hover:-translate-y-1'}
      `}
    >
      {/* Owned badge */}
      {isOwned && (
        <div className="absolute top-3 right-3 bg-sage-green text-cream text-xs font-semibold px-2 py-1 rounded-full">
          Owned
        </div>
      )}

      {/* Content */}
      <div className="space-y-3">
        <h3 className="font-serif text-lg text-charcoal pr-16">
          {upgrade.name}
        </h3>
        
        <p className="text-sm text-dim-grey leading-relaxed">
          {upgrade.description}
        </p>

        {/* Effect badge */}
        <div className="inline-flex items-center gap-2 bg-dusty-mauve/10 text-dusty-mauve px-3 py-1 rounded-full text-sm font-semibold">
          <span>⚡</span>
          <span>{getEffectText()}</span>
        </div>

        {/* Requirements */}
        {upgrade.requires && upgrade.requires.length > 0 && (
          <div className="text-xs text-dim-grey">
            Requirements: {getRequirementText()}
          </div>
        )}

        {/* Purchase button */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-xl font-bold text-charcoal">
            {upgrade.cost} XP
          </span>
          
          <button
            onClick={handlePurchase}
            disabled={isOwned || !canPurchase || !canAfford || isPurchasing}
            className={`
              px-4 py-2 rounded-lg font-semibold text-sm
              transition-all duration-200
              min-w-[80px]
              ${
                isOwned
                  ? 'bg-sage-green/20 text-sage-green cursor-not-allowed'
                  : canPurchase && canAfford
                  ? 'bg-gradient-to-r from-terracotta to-dusty-mauve text-cream hover:shadow-md hover:scale-105'
                  : 'bg-dim-grey/20 text-dim-grey cursor-not-allowed'
              }
            `}
          >
            {isPurchasing ? (
              <span className="animate-breathing-spinner">⏳</span>
            ) : isOwned ? (
              '✓ Owned'
            ) : !canPurchase ? (
              'Locked'
            ) : !canAfford ? (
              'Too Expensive'
            ) : (
              'Buy'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
