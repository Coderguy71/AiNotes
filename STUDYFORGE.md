# StudyForge Documentation

**StudyForge** is EasyNotesAI's gamification system that rewards users for studying with XP, levels, upgrades, missions, and daily streaks. This document provides a comprehensive guide to understanding and working with the StudyForge system.

---

## Table of Contents

1. [Overview](#overview)
2. [XP Economy](#xp-economy)
3. [Leveling System](#leveling-system)
4. [Upgrades](#upgrades)
5. [Missions](#missions)
6. [Daily Streaks](#daily-streaks)
7. [Passive XP](#passive-xp)
8. [Settings](#settings)
9. [Event System](#event-system)
10. [XP Integration Points](#xp-integration-points)
11. [UI Components](#ui-components)
12. [Data Persistence](#data-persistence)
13. [Developer Guide](#developer-guide)
14. [Testing Guide](#testing-guide)
15. [Troubleshooting](#troubleshooting)

---

## Overview

StudyForge transforms studying into a rewarding experience by tracking user progress through a comprehensive XP and progression system. Users earn XP by:

- **Transforming notes** (15 XP)
- **Saving notes to history** (50 XP)
- **Generating flashcard sets** (40 XP)
- **Saving flashcard sets** (25 XP)
- **Reviewing flashcards** (10 XP per card marked as known)

XP is enhanced by **multipliers** from upgrades and streak bonuses. The system also tracks **daily missions**, **passive XP generation**, and **achievement milestones**.

### Key Features

- **Persistent State**: All data stored in IndexedDB (client-side)
- **Real-time UI**: Event-driven architecture for instant feedback
- **Multipliers**: Stack XP bonuses from multiple upgrades
- **Idle Progression**: Earn passive XP even when away
- **Daily Challenges**: Rotating missions with bonus rewards
- **Streak Bonuses**: Double XP when maintaining 3+ day streaks

---

## XP Economy

### Base XP Awards

| Action | Base XP | Mission ID | Location |
|--------|---------|------------|----------|
| Transform notes | 15 | `create_notes` | `app/page.tsx` |
| Save note to history | 50 | `create_notes` | `components/SmartStructureCard.tsx` |
| Generate flashcards | 40 | `generate_flashcards` | `app/dashboard/page.tsx` |
| Save flashcard set | 25 | (none) | `app/flashcards/[id]/page.tsx` |
| Review flashcard (mark as known) | 10 | `review_flashcards` | `app/flashcards/[id]/page.tsx` |
| Claim mission | Varies | (none) | `app/studyforge/page.tsx` |
| Collect idle XP | Varies | (none) | `app/studyforge/page.tsx` |

### XP Multipliers

The effective XP awarded is calculated as:

```
effectiveXP = baseXP × totalMultiplier
```

Where `totalMultiplier` is computed as:

```
totalMultiplier = 1.0 + upgradeMultipliers + streakMultiplier
```

**Example**: With Note Mastery I (10%) and Flashcard Grinder I (20%) purchased, plus a 3-day streak (100% with Streak Booster):
- Base XP: 50
- Total multiplier: 1.0 + 0.10 + 0.20 + 1.0 = **2.3x**
- Effective XP: 50 × 2.3 = **115 XP**

### XP Types

1. **Active XP**: Earned through direct actions (transforms, reviews, etc.)
2. **Passive XP**: Generated automatically based on `passiveXPPerSec` rate
3. **Mission Rewards**: Fixed bonuses for completing missions (no multipliers)
4. **Idle XP**: Accumulated passive XP while away (capped at 24 hours)

---

## Leveling System

### XP Curve Formula

StudyForge uses a **power curve** for smooth progression:

```javascript
XP for level N = 100 × (N^1.5)
```

### Level Progression Table

| Level | Total XP Required | XP to Next Level |
|-------|-------------------|------------------|
| 1 | 0 | 100 |
| 2 | 100 | 183 |
| 3 | 283 | 237 |
| 4 | 520 | 282 |
| 5 | 802 | 316 |
| 10 | 3,162 | 565 |
| 15 | 8,704 | 810 |
| 20 | 17,889 | 1,050 |
| 25 | 31,250 | 1,285 |
| 30 | 49,244 | 1,518 |

The formula ensures:
- **Early levels**: Fast progression to hook users
- **Mid-game**: Steady pacing to maintain engagement
- **Late-game**: Meaningful milestones without excessive grind

### Implementation

Leveling is handled automatically in `lib/studyForge.ts`:

```typescript
// Calculate current level from total XP
const level = getLevelFromTotalXP(totalXP);

// Calculate XP for next level
const xpForNext = getXPForLevel(level + 1);

// Calculate progress percentage
const xpIntoLevel = totalXP - getXPForLevel(level);
const xpForNextLevel = xpForNext - getXPForLevel(level);
const xpProgress = xpIntoLevel / xpForNextLevel; // 0.0 to 1.0
```

When a user levels up:
1. Level is recalculated
2. `levelUp` event is emitted
3. Activity log entry is created
4. LevelUpModal is shown (if notifications enabled)

---

## Upgrades

### Upgrade System Overview

Upgrades are permanent purchases that enhance XP gains, unlock features, or provide passive benefits. They cost **availableXP** (not totalXP), so spending doesn't affect your level.

### Upgrade Definitions

All upgrades are defined in `lib/studyForge.ts`:

| ID | Name | Cost | Prerequisites | Effect |
|----|------|------|---------------|--------|
| `note_mastery_1` | Note Mastery I | 100 XP | (none) | +10% XP multiplier |
| `note_mastery_2` | Note Mastery II | 500 XP | Note Mastery I | +15% XP multiplier |
| `flashcard_grinder_1` | Flashcard Grinder I | 300 XP | (none) | +20% XP multiplier |
| `review_efficiency_1` | Review Efficiency I | 250 XP | (none) | +12% XP multiplier |
| `small_furnace` | Small Furnace | 200 XP | (none) | +0.5 passive XP/sec |
| `bigger_furnace` | Bigger Furnace | 800 XP | Small Furnace | +1.5 passive XP/sec (total: 2.0 XP/sec) |
| `streak_booster` | Streak Booster | 400 XP | (none) | 2x XP when streak ≥ 3 days |
| `mindforge_theme_pack` | Mindforge Theme Pack | 600 XP | (none) | Unlocks dark theme |
| `auto_collect` | Auto-Collect | 1000 XP | (none) | Auto-collect idle XP (up to 24h) |

### Upgrade Types

1. **Multiplier Upgrades**: Add to the total XP multiplier
   - Stack additively (e.g., 10% + 20% = 30% total bonus)
   
2. **Passive XP Upgrades**: Increase passive XP generation rate
   - Stack additively (e.g., 0.5 + 1.5 = 2.0 XP/sec)
   
3. **Theme Upgrades**: Unlock visual customization options
   - Adds theme to `ownedThemes` array
   
4. **Feature Upgrades**: Enable special functionality
   - `auto_collect`: Automatically credits idle XP on app load

### Purchase Logic

Purchases are validated in `purchaseUpgrade()`:

```typescript
// Check if already owned
if (state.upgrades[upgradeId]) return false;

// Check prerequisites
if (upgrade.requires) {
  for (const reqId of upgrade.requires) {
    if (!state.upgrades[reqId]) return false;
  }
}

// Check affordability
if (state.availableXP < upgrade.cost) return false;

// Deduct cost and apply effects
state.availableXP -= upgrade.cost;
state.upgrades[upgradeId] = true;
```

### Adding New Upgrades

To add a new upgrade:

1. **Define the upgrade** in `UPGRADES` array (`lib/studyForge.ts`):
   ```typescript
   {
     id: 'new_upgrade_id',
     name: 'Display Name',
     description: 'What it does',
     cost: 500,
     requires: ['prerequisite_id'], // Optional
     effect: { type: 'multiplier', value: 0.25 } // +25% XP
   }
   ```

2. **Update UI** (optional): The `StudyForgeShop` component automatically renders all upgrades from the `UPGRADES` array.

3. **Test**: Use `/studyforge-test` to verify purchase logic, prerequisite checks, and effect application.

---

## Missions

### Mission System Overview

**Daily Missions** are rotating challenges that reset every day at midnight (local time). Users can have up to **3 active missions** at once, randomly selected from a pool of 6 templates.

### Mission Pool

| ID | Title | Description | Target | Reward |
|----|-------|-------------|--------|--------|
| `create_notes` | Note Creator | Create 3 notes | 3 | 50 XP |
| `generate_flashcards` | Flashcard Master | Generate 2 flashcard sets | 2 | 60 XP |
| `review_flashcards` | Study Session | Review 20 flashcards | 20 | 40 XP |
| `earn_xp` | XP Hunter | Earn 100 XP from any source | 100 | 30 XP |
| `daily_login` | Daily Commitment | Log in and interact with the app | 1 | 25 XP |
| `study_streak` | Consistency Champion | Maintain your study streak | 1 | 35 XP |

### Mission Lifecycle

1. **Seeding**: On first app load each day, 3 missions are randomly selected
2. **Progress Tracking**: Missions are incremented via `awardXP(baseXP, reason, missionId)`
3. **Completion**: When `progress >= target`, mission can be claimed
4. **Claiming**: User clicks "Claim" button to receive reward XP (no multipliers)
5. **Reset**: At midnight (local time), all missions are re-seeded with new random selections

### Mission Progress

Mission progress is updated automatically when calling `awardXP()` with a `missionId`:

```typescript
// Example: Marking a flashcard as known awards XP and updates mission
await awardXP(10, 'Review flashcard', 'review_flashcards');
```

The `earn_xp` mission is special—it tracks **all** XP gains regardless of source:

```typescript
// Auto-tracked in awardXP()
const earnXPMission = state.activeMissions.find(m => m.id === 'earn_xp');
if (earnXPMission && !earnXPMission.claimed) {
  earnXPMission.progress += effectiveXP;
}
```

### Adding New Missions

To add a new mission:

1. **Define template** in `MISSION_POOL` (`lib/studyForge.ts`):
   ```typescript
   {
     id: 'new_mission_id',
     title: 'Mission Title',
     description: 'Clear description of goal',
     target: 5, // Goal number
     reward: 45 // Bonus XP
   }
   ```

2. **Track progress**: Call `awardXP()` with the mission ID:
   ```typescript
   await awardXP(10, 'Action reason', 'new_mission_id');
   ```

3. **Test**: Check that progress increments correctly and reward is granted on claim.

---

## Daily Streaks

### Streak Tracking

A **daily streak** counts consecutive days the user has earned XP. Streaks:
- **Increment** if the user earns XP and yesterday was the last streak day
- **Reset to 1** if more than 1 day has passed since last activity
- **Maintain** if the user has already earned XP today

### Streak Logic

Streaks are updated in `awardXP()`:

```typescript
function updateStreak(lastStreakDate: string, currentStreak: number): number {
  const today = getTodayDateString(); // YYYY-MM-DD
  
  if (lastStreakDate === today) {
    return currentStreak; // Already counted today
  } else if (isYesterday(lastStreakDate)) {
    return currentStreak + 1; // Consecutive day
  } else {
    return 1; // Streak broken
  }
}
```

### Streak Booster Upgrade

The **Streak Booster** upgrade doubles XP gains when the streak is 3+ days:

```typescript
// Applied in computeMultipliers()
if (upgrades['streak_booster'] && dailyStreak >= 3) {
  streakMultiplier = 1.0; // +100% (double XP)
}
```

**Example**:
- Streak: 5 days
- Streak Booster: Owned
- Base XP: 50
- Multiplier: 1.0 (base) + 1.0 (streak) = **2.0x**
- Effective XP: 50 × 2.0 = **100 XP**

---

## Passive XP

### Passive Generation

Upgrades can grant **passive XP generation** that accumulates over time:

| Upgrade | Effect |
|---------|--------|
| Small Furnace | +0.5 XP/sec |
| Bigger Furnace | +1.5 XP/sec (stacks with Small Furnace) |

### Idle XP Accumulation

When you return to the app after being away:

1. **Calculate elapsed time** since `lastActiveAt`
2. **Cap at 24 hours** (86,400 seconds)
3. **Calculate idle XP**: `elapsedSeconds × passiveXPPerSec`
4. **Credit or store**:
   - **With Auto-Collect**: Immediately added to `totalXP` and `availableXP`
   - **Without Auto-Collect**: Stored in `pendingIdleXP` until manually collected

### Auto-Collect Upgrade

The **Auto-Collect** upgrade (1000 XP) automatically credits idle XP on app load:

```typescript
if (hasAutoCollect) {
  state.totalXP += idleXP;
  state.availableXP += idleXP;
  state.pendingIdleXP = 0;
} else {
  state.pendingIdleXP += idleXP;
}
```

Without Auto-Collect, users must manually click the **"Collect Idle XP"** button in the StudyForge header.

---

## Settings

### Available Settings

StudyForge settings are stored in the `settings` object:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `theme` | string | `'default'` | Active theme name |
| `autoCollect` | boolean | `false` | Auto-collect idle XP (requires upgrade) |
| `soundEnabled` | boolean | `true` | Play XP sound effects |
| `notificationsEnabled` | boolean | `true` | Show XP toasts and modals |
| `enableConfetti` (stored as any) | boolean | `true` | Show confetti on level up |

### Settings UI

Settings are managed in the **StudyForgeHeader** component:

- Click the **⚙ gear icon** to open the Quick Actions modal
- Toggle switches for sound, notifications, and confetti
- Changes are saved instantly via `updateSettings()`

### Settings in Code

```typescript
// Update settings
await updateSettings({ soundEnabled: false });

// Read settings
const state = getStudyForgeState();
if (state?.settings.notificationsEnabled) {
  // Show notification
}
```

---

## Event System

### Event Bus

StudyForge uses a **pub/sub event bus** for reactive UI updates without prop drilling.

### Event Types

```typescript
type StudyForgeEvent =
  | { type: 'xpAwarded'; xp: number; effectiveXP: number; reason: string }
  | { type: 'levelUp'; newLevel: number; totalXP: number }
  | { type: 'settingsChanged'; settings: StudyForgeSettings }
  | { type: 'upgradePurchased'; upgradeId: string; name: string }
  | { type: 'missionCompleted'; missionId: string; reward: number };
```

### Subscribing to Events

```typescript
import { subscribeStudyForge } from '@/lib/studyForge';

useEffect(() => {
  const unsubscribe = subscribeStudyForge((event) => {
    if (event.type === 'xpAwarded') {
      console.log(`Earned ${event.effectiveXP} XP: ${event.reason}`);
    } else if (event.type === 'levelUp') {
      console.log(`Leveled up to ${event.newLevel}!`);
    }
  });
  
  return () => unsubscribe();
}, []);
```

### Global Event Listeners

The following components listen to events globally:

- **XPToastHost** (`components/studyforge/XPToast.tsx`): Shows toast notifications for `xpAwarded` and `levelUp`
- **LevelUpModal** (`components/studyforge/LevelUpModal.tsx`): Shows full-screen modal for `levelUp`
- **StudyForgeProvider** (`components/providers/StudyForgeProvider.tsx`): Refreshes state on all events

---

## XP Integration Points

### Summary Table

| Location | Action | Base XP | Mission ID | Notes |
|----------|--------|---------|------------|-------|
| `app/page.tsx` | Transform notes | 15 | `create_notes` | After successful `generateNotes()` |
| `components/SmartStructureCard.tsx` | Save note | 50 | `create_notes` | After `saveNote()` to Dexie |
| `app/dashboard/page.tsx` | Generate flashcards | 40 | `generate_flashcards` | After `/api/generateFlashcards` success |
| `app/dashboard/page.tsx` | Save flashcard set | 25 | (none) | After `saveFlashcardSet()` |
| `app/flashcards/[id]/page.tsx` | Save unsaved set | 25 | (none) | If set not yet persisted |
| `app/flashcards/[id]/page.tsx` | Mark card as known | 10 | `review_flashcards` | Each card marked during review |
| `app/studyforge/page.tsx` | Claim mission | Varies | (none) | Manual claim by user |
| `app/studyforge/page.tsx` | Collect idle XP | Varies | (none) | Manual collection (if no auto-collect) |

### Code Examples

#### Home Page (Transform Notes)

```typescript
// app/page.tsx
const result = await generateNotes({ input, format });

if (result.success && result.output) {
  setOutput(result.output);
  
  // Award 15 XP for transformation
  await awardXP(15, 'Transform notes', 'create_notes');
  setShowTransformXP(true);
  setTimeout(() => setShowTransformXP(false), 3000);
}
```

#### SmartStructureCard (Save Note)

```typescript
// components/SmartStructureCard.tsx
const handleSave = async () => {
  const id = await saveNote(noteToSave);
  
  // Award 50 XP for saving
  await awardXP(50, 'Save note to history', 'create_notes');
  setShowXPBadge(true);
  setTimeout(() => setShowXPBadge(false), 3000);
};
```

#### Dashboard (Generate + Save Flashcards)

```typescript
// app/dashboard/page.tsx
const response = await fetch('/api/generateFlashcards', {
  method: 'POST',
  body: JSON.stringify({ text: note.rawText, numCards: 10 })
});

const data = await response.json();

if (data.success && data.cards) {
  // Award 40 XP for generation
  await awardXP(40, 'Generate flashcard set', 'generate_flashcards');
  
  // Save to Dexie
  const setId = await saveFlashcardSet(flashcardSet);
  
  // Award 25 XP for saving
  await awardXP(25, 'Save flashcard set');
  
  // Total: 65 XP
}
```

#### Flashcard Viewer (Review Card)

```typescript
// app/flashcards/[id]/page.tsx
const handleMarkKnown = async (cardIndex: number) => {
  if (knownCards.includes(cardIndex)) return;
  
  setKnownCards([...knownCards, cardIndex]);
  
  // Award 10 XP for reviewing
  const xpEarned = await awardXP(10, 'Review flashcard', 'review_flashcards');
  setSessionXP(prev => prev + xpEarned);
  
  // Play sound effect
  if (state?.settings.soundEnabled) {
    playXPSound();
  }
};
```

---

## UI Components

### Core Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `StudyForgeProvider` | `components/providers/` | React context for global state |
| `StudyForgeHeader` | `components/studyforge/` | Level badge, XP bar, idle XP collection, settings |
| `StudyForgeShop` | `components/studyforge/` | Grid of upgrade cards |
| `UpgradeCard` | `components/studyforge/` | Individual upgrade display with purchase button |
| `MissionCard` | `components/studyforge/` | Mission progress bar and claim button |
| `StudyActivityFeed` | `components/studyforge/` | Last 10 activity log entries + CSV export |
| `OwnedThemesPreview` | `components/studyforge/` | Theme selection UI |
| `XPToastHost` | `components/studyforge/` | Global toast notifications (portal) |
| `LevelUpModal` | `components/studyforge/` | Full-screen level-up celebration (portal) |
| `StudyForgeNavLink` | `components/` | Navigation link with XP badge |
| `XPFloatingBadge` | `components/` | Inline "+XX XP" indicator |
| `FloatingXPIndicator` | `components/` | Positioned XP indicator for cards |

### StudyForgeProvider

The provider must wrap your app in `layout.tsx`:

```tsx
import { StudyForgeProvider } from '@/components/providers/StudyForgeProvider';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <StudyForgeProvider>
          {children}
        </StudyForgeProvider>
        <XPToastHost />
        <LevelUpModal />
      </body>
    </html>
  );
}
```

### Using StudyForge State

```typescript
import { useStudyForge } from '@/components/providers/StudyForgeProvider';

function MyComponent() {
  const { state, isLoading, error, refreshState } = useStudyForge();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <p>Level: {state.level}</p>
      <p>XP: {state.totalXP}</p>
      <p>Available: {state.availableXP}</p>
    </div>
  );
}
```

### XP Feedback Components

**XPFloatingBadge** (inline indicator):
```tsx
<XPFloatingBadge amount={15} visible={showBadge} />
```

**FloatingXPIndicator** (positioned on cards):
```tsx
<FloatingXPIndicator 
  amount={10} 
  visible={showIndicator} 
  enableAnimations={state?.settings.notificationsEnabled}
/>
```

---

## Data Persistence

### Database Schema

StudyForge uses **Dexie** (IndexedDB wrapper) for client-side persistence.

#### Schema Definition

```typescript
// lib/db.ts
export const db = new Dexie('EasyNotesAI');

db.version(3).stores({
  notes: '++id, timestamp, subject, topic, difficulty, *tags',
  flashcardSets: '++id, noteId, createdAt',
  studyForge: '++id' // Singleton table (id always = 1)
});
```

### StudyForgeRecord Interface

```typescript
interface StudyForgeRecord {
  id?: number; // Always 1 (singleton)
  totalXP: number; // Cumulative XP (never decreases)
  availableXP: number; // Spendable XP (decreases on upgrade purchase)
  level: number; // Current level
  xpForNext: number; // XP required for next level
  xpProgress: number; // Progress 0.0-1.0
  pendingIdleXP: number; // Idle XP awaiting collection
  passiveXPPerSec: number; // Passive generation rate
  lastActiveAt: string; // ISO timestamp
  dailyStreak: number; // Consecutive days
  lastStreakDate: string; // YYYY-MM-DD
  missionsLastSeededAt: string; // YYYY-MM-DD
  activeMissions: DailyMission[]; // Current 3 missions
  ownedThemes: string[]; // Unlocked themes
  upgrades: StudyForgeUpgradeState; // { upgradeId: true }
  settings: StudyForgeSettings; // User preferences
  activityLog: ActivityLogEntry[]; // Last 10 events
}
```

### CRUD Operations

```typescript
// Get state (singleton)
const state = await getStudyForge();

// Save/update state
await saveStudyForge(state);

// Initialize (creates if not exists)
await initStudyForge();
```

### In-Memory State

StudyForge maintains an **in-memory singleton** for fast read access:

```typescript
let inMemoryState: StudyForgeRecord | null = null;

// Read-only access
export function getStudyForgeState(): StudyForgeRecord | null {
  return inMemoryState ? { ...inMemoryState } : null;
}
```

All mutations sync to IndexedDB via `saveStudyForge()`.

---

## Developer Guide

### Architecture Overview

```
┌─────────────────────────────────────────────┐
│  UI Components (React)                      │
│  - StudyForgeHeader, Shop, Missions, etc.  │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  StudyForgeProvider (Context)               │
│  - Manages state, subscribes to events      │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  lib/studyForge.ts (Core Engine)            │
│  - awardXP(), purchaseUpgrade(), etc.       │
│  - Event bus (pub/sub)                      │
│  - In-memory state + IndexedDB sync         │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│  lib/db.ts (Dexie / IndexedDB)              │
│  - getStudyForge(), saveStudyForge()        │
└─────────────────────────────────────────────┘
```

### Adding a New XP Source

1. **Identify the action** (e.g., "Export PDF")
2. **Determine base XP** (e.g., 5 XP)
3. **Optional: Link to mission** (e.g., `'export_documents'`)
4. **Call awardXP()** in the appropriate component:

```typescript
// Example: Award XP after exporting PDF
const handleExportPDF = async () => {
  await generatePDF();
  await awardXP(5, 'Export PDF'); // No mission link
  toast.success('PDF exported! (+5 XP)');
};
```

5. **Update documentation** (this file) with the new integration point
6. **Test** on `/studyforge-test` to verify XP is awarded

### Adding a New Upgrade

See [Upgrades > Adding New Upgrades](#adding-new-upgrades) section above.

### Adding a New Mission

See [Missions > Adding New Missions](#adding-new-missions) section above.

### Modifying the XP Curve

To change leveling speed, adjust the constants in `lib/studyForge.ts`:

```typescript
const XP_BASE = 100; // Base XP for level 1
const XP_EXPONENT = 1.5; // Power curve exponent
```

**Higher exponent** = steeper curve (harder to level up)  
**Lower exponent** = flatter curve (easier to level up)

Then update the [Level Progression Table](#level-progression-table) in this document.

---

## Testing Guide

### Manual QA Checklist

Use this checklist to verify all StudyForge functionality:

#### XP Integration Points
- [ ] **Transform Notes** (15 XP)
  - Go to home page
  - Enter text and generate notes
  - Verify "+15 XP" badge appears
  - Check toast notification
- [ ] **Save Note** (50 XP)
  - Expand Smart Structure card
  - Click "Save to History"
  - Verify "+50 XP" badge appears
  - Check toast notification
- [ ] **Generate Flashcards** (40 XP)
  - Go to dashboard
  - Click generate flashcards on any note
  - Verify "+65 XP" toast (40 + 25)
- [ ] **Save Flashcard Set** (25 XP)
  - Navigate to unsaved flashcard set
  - Click "Save Set"
  - Verify "+25 XP" toast
- [ ] **Review Flashcard** (10 XP per card)
  - Open flashcard viewer
  - Click "I knew this" on a card
  - Verify "+10 XP" floating indicator
  - Verify XP sound plays (if enabled)
  - Check session XP increments

#### Level Progression
- [ ] Level up triggers when threshold reached
- [ ] LevelUpModal appears with confetti
- [ ] Progress bar updates correctly
- [ ] Activity log shows level-up entry

#### Upgrades
- [ ] Upgrade cards show correct cost and description
- [ ] Prerequisites are enforced (e.g., Note Mastery II requires Note Mastery I)
- [ ] Purchase button disabled when:
  - Already owned
  - Insufficient XP
  - Prerequisites not met
- [ ] XP multipliers apply correctly after purchase
- [ ] Passive XP rate increases after furnace purchases
- [ ] Theme unlocks after purchasing theme pack
- [ ] Auto-collect enables after purchase

#### Missions
- [ ] Three missions are active on first load
- [ ] Mission progress increments correctly
- [ ] Claim button enabled when `progress >= target`
- [ ] Claimed missions show "Claimed" state
- [ ] Missions reset at midnight (test by changing system time)
- [ ] `earn_xp` mission tracks all XP sources

#### Daily Streaks
- [ ] Streak increments when earning XP on consecutive days
- [ ] Streak resets if a day is skipped
- [ ] Streak badge shows correct number
- [ ] Streak Booster doubles XP when streak ≥ 3

#### Passive XP
- [ ] Passive XP rate shown in header
- [ ] Idle XP accumulates while away (test by closing and reopening app)
- [ ] "Collect Idle XP" button appears when `pendingIdleXP > 0`
- [ ] Auto-collect upgrade credits XP automatically on load
- [ ] Idle XP capped at 24 hours

#### Settings
- [ ] Sound toggle enables/disables XP chime
- [ ] Notifications toggle shows/hides XP toasts and modals
- [ ] Confetti toggle shows/hides level-up confetti
- [ ] Theme selection changes active theme
- [ ] Settings persist across sessions

#### Activity Log
- [ ] Last 10 events shown in order (newest first)
- [ ] CSV export downloads file with correct data
- [ ] Exported CSV opens correctly in Excel (UTF-8 BOM)

#### UI/UX
- [ ] All animations respect `prefers-reduced-motion`
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Touch targets meet 48px minimum
- [ ] Loading states shown during async operations
- [ ] Error states display user-friendly messages

### Testing Page

Navigate to `/studyforge-test` for a manual testing console:

- **State Display**: View all current StudyForge state
- **Multiplier Breakdown**: See how bonuses stack
- **Quick Actions**: Award XP with different reasons/missions
- **Upgrade Management**: Purchase upgrades and test prerequisites
- **Mission Tracking**: Check progress and claim rewards
- **Event Stream**: Monitor real-time events

### Resetting State for Clean Tests

To start fresh:

1. **Open DevTools** (F12)
2. **Application tab** → IndexedDB → EasyNotesAI
3. **Right-click database** → Delete database
4. **Refresh page** (state will reinitialize with defaults)

### Automated Testing Tips

For future integration tests:

```typescript
// Mock Dexie for tests
jest.mock('@/lib/db', () => ({
  getStudyForge: jest.fn(),
  saveStudyForge: jest.fn(),
}));

// Test XP award
import { awardXP, initStudyForge } from '@/lib/studyForge';

test('awardXP applies multipliers correctly', async () => {
  await initStudyForge();
  const effectiveXP = await awardXP(50, 'Test action');
  expect(effectiveXP).toBeGreaterThanOrEqual(50);
});
```

---

## Troubleshooting

### Common Issues

#### XP Not Awarded

**Symptoms**: XP badge doesn't appear, toast doesn't show

**Causes**:
- `awardXP()` not called after action
- Error in `awardXP()` call (check console)
- Notifications disabled in settings

**Solutions**:
1. Check browser console for errors
2. Verify `awardXP()` is awaited: `await awardXP(15, 'Reason')`
3. Check settings: Settings panel → Notifications toggle
4. Verify StudyForgeProvider is mounted in layout

#### Missions Not Resetting

**Symptoms**: Same missions persist across multiple days

**Causes**:
- System time not advancing
- `missionsLastSeededAt` not updating

**Solutions**:
1. Check system date/time is correct
2. Open DevTools → Application → IndexedDB → studyForge table
3. Verify `missionsLastSeededAt` field
4. Manually reset: Delete database and refresh page

#### Idle XP Not Accumulating

**Symptoms**: `pendingIdleXP` stays at 0 after being away

**Causes**:
- No passive XP upgrades purchased
- `lastActiveAt` timestamp not updating
- Auto-collect enabled but not working

**Solutions**:
1. Purchase Small Furnace or Bigger Furnace upgrade
2. Check `passiveXPPerSec` > 0 in state
3. Verify `lastActiveAt` is an ISO timestamp
4. For auto-collect issues, check upgrade is marked as owned

#### Level Not Increasing

**Symptoms**: XP increases but level stays the same

**Causes**:
- XP curve calculation error
- Database not saving updated level

**Solutions**:
1. Check console for errors in `getLevelFromTotalXP()`
2. Verify `totalXP` is actually increasing (not just `availableXP`)
3. Test formula: `100 × (level^1.5)` for expected threshold
4. Delete database and reinitialize if state is corrupted

#### Upgrades Not Applying

**Symptoms**: Purchased upgrade but multiplier/effect not working

**Causes**:
- Upgrade not marked as owned in `upgrades` object
- Effect calculation bug
- Page not refreshed after purchase

**Solutions**:
1. Check `state.upgrades[upgradeId]` is `true` in DevTools
2. Verify multiplier in StudyForgeHeader or test page
3. For passive XP: Check `passiveXPPerSec` increased
4. For themes: Check theme in `ownedThemes` array

#### Database Corruption

**Symptoms**: App crashes on load, state resets randomly

**Causes**:
- Invalid data in IndexedDB
- Schema version mismatch
- Browser storage cleared

**Solutions**:
1. Clear IndexedDB (see "Resetting State" above)
2. Check browser console for Dexie errors
3. Ensure Dexie schema version is 3
4. If persistent, check for browser storage quota issues

### Debugging Tips

1. **Enable verbose logging**: Check browser console (StudyForge logs all operations)
2. **Inspect state**: Use React DevTools to view StudyForgeProvider state
3. **Monitor events**: Subscribe to event bus and log all events
4. **Use test page**: `/studyforge-test` provides full state visibility
5. **Check database**: Application tab → IndexedDB → EasyNotesAI → studyForge

### Getting Help

If you encounter issues not covered here:

1. Check browser console for errors
2. Verify StudyForge is initialized: `getStudyForgeState()` should return an object
3. Test on `/studyforge-test` to isolate the issue
4. Check if issue is reproducible after database reset
5. File a bug report with:
   - Steps to reproduce
   - Browser/OS version
   - Console errors
   - Screenshot of state (from test page)

---

## CSV Export

The **Activity Feed** component provides a CSV export feature for activity log data.

### Export Format

```csv
Timestamp,Type,Message,XP Amount,Level
2024-01-15T14:30:00.000Z,xp_earned,Transform notes (+15 XP),15,
2024-01-15T14:32:00.000Z,level_up,Leveled up to 2!,,2
```

### Using the Export

1. Navigate to `/studyforge`
2. Scroll to Activity Feed section
3. Click "Export CSV" button
4. File downloads as `studyforge-activity.csv`

### UTF-8 Encoding

The exported CSV includes a **UTF-8 BOM** (Byte Order Mark) for Excel compatibility:

```typescript
const BOM = '\uFEFF';
const csvContent = BOM + csvData;
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
```

This ensures proper character encoding when opened in Microsoft Excel.

---

## Future Enhancements

Potential improvements for StudyForge:

- **Weekly challenges**: Longer-term missions with bigger rewards
- **Leaderboards**: Compare progress with other users (requires backend)
- **Badges/achievements**: Visual milestones for special accomplishments
- **Seasonal events**: Limited-time missions or themes
- **More themes**: Additional visual customization options
- **XP decay**: Optional mechanic for long-term engagement
- **Prestige system**: Reset level for permanent bonuses
- **Social sharing**: Share level/stats on social media
- **Analytics dashboard**: Detailed graphs of XP earnings over time
- **Mobile app**: Native mobile version with push notifications

---

## Changelog

### Version 1.0 (Current)
- Initial release
- XP economy with 5 integration points
- 9 upgrades with prerequisites and stacking effects
- 6-mission pool with daily rotation
- Daily streak tracking with 2x bonus
- Passive XP generation with 24h cap
- Auto-collect upgrade
- Event-driven UI with toasts and modals
- Activity log with CSV export
- Dark theme unlock
- Comprehensive settings panel

---

**Last Updated**: December 2024  
**Maintainer**: EasyNotesAI Team
