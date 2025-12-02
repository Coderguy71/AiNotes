'use client';

import { UPGRADES } from '@/lib/studyForge';
import { UpgradeCard } from './UpgradeCard';

export function StudyForgeShop() {
  return (
    <div className="bg-cream rounded-lg p-6 border-2 border-almond-silk shadow-md">
      <h2 className="text-2xl font-serif text-charcoal mb-6">Upgrade Shop</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {UPGRADES.map((upgrade) => (
          <UpgradeCard key={upgrade.id} upgrade={upgrade} />
        ))}
      </div>
    </div>
  );
}
