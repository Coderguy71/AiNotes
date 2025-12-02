'use client';

/**
 * StudyForge Core Engine
 * 
 * A comprehensive gamification system for EasyNotesAI that rewards users for studying.
 * 
 * Key Features:
 * - XP economy with multipliers from upgrades and streaks
 * - Level progression with smooth power curve (100 × level^1.5)
 * - 9 upgrades with prerequisites and stacking effects
 * - Daily missions with 6-mission pool rotation
 * - Daily streak tracking with 2x bonus (Streak Booster upgrade)
 * - Passive XP generation (up to 24 hours)
 * - Event-driven architecture for reactive UI
 * 
 * For comprehensive documentation, see STUDYFORGE.md:
 * - XP integration points and amounts
 * - Upgrade definitions and effects
 * - Mission pool and seeding logic
 * - Settings and customization
 * - Testing guide and troubleshooting
 * 
 * @module lib/studyForge
 */

import {
  getStudyForge,
  saveStudyForge,
  type StudyForgeRecord,
  type DailyMission,
  type StudyForgeSettings,
  type StudyForgeUpgradeState,
  type ActivityLogEntry,
} from '@/lib/db';

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Upgrade definition with cost, requirements, and effects
 */
export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  cost: number;
  requires?: string[]; // Array of upgrade IDs that must be purchased first
  effect: {
    type: 'passive_xp' | 'multiplier' | 'theme' | 'auto_collect';
    value?: number; // For passive_xp (XP per second) or multiplier (decimal)
    theme?: string; // For theme unlocks
  };
}

/**
 * Mission definition template for daily mission pool
 */
export interface MissionTemplate {
  id: string;
  title: string;
  description: string;
  target: number;
  reward: number;
}

/**
 * XP multiplier breakdown for transparency
 */
export interface XPMultipliers {
  base: number; // Always 1.0
  upgrades: number; // From purchased upgrades
  streak: number; // From daily streak
  total: number; // Product of all multipliers
}

/**
 * Event types for the event bus
 */
export type StudyForgeEvent =
  | { type: 'xpAwarded'; xp: number; effectiveXP: number; reason: string }
  | { type: 'levelUp'; newLevel: number; totalXP: number }
  | { type: 'settingsChanged'; settings: StudyForgeSettings }
  | { type: 'upgradePurchased'; upgradeId: string; name: string }
  | { type: 'missionCompleted'; missionId: string; reward: number };

/**
 * Event handler function type
 */
export type EventHandler = (event: StudyForgeEvent) => void;

// ============================================================================
// Constants and Definitions
// ============================================================================

/**
 * XP curve formula: XP for level N = 100 * (N^1.5)
 * This provides smooth progression with gradually increasing requirements
 * 
 * Example progression:
 * - Level 1: 100 XP
 * - Level 2: 283 XP
 * - Level 3: 520 XP
 * - Level 5: 1,118 XP
 * - Level 10: 3,162 XP
 */
const XP_BASE = 100;
const XP_EXPONENT = 1.5;

/**
 * Upgrade definitions with costs and effects
 * 
 * All upgrades are permanent purchases that enhance XP gains or unlock features.
 * Multipliers stack additively (e.g., 10% + 20% = 30% total bonus).
 * 
 * To add a new upgrade:
 * 1. Add definition to this array
 * 2. UI will automatically render it in StudyForgeShop
 * 3. Test purchase logic on /studyforge-test page
 * 
 * See STUDYFORGE.md > Upgrades section for detailed documentation.
 */
export const UPGRADES: UpgradeDefinition[] = [
  {
    id: 'note_mastery_1',
    name: 'Note Mastery I',
    description: 'Gain 10% more XP from all sources',
    cost: 100,
    effect: { type: 'multiplier', value: 0.1 },
  },
  {
    id: 'note_mastery_2',
    name: 'Note Mastery II',
    description: 'Gain an additional 15% more XP from all sources',
    cost: 500,
    requires: ['note_mastery_1'],
    effect: { type: 'multiplier', value: 0.15 },
  },
  {
    id: 'flashcard_grinder_1',
    name: 'Flashcard Grinder I',
    description: 'Gain 20% more XP from all sources',
    cost: 300,
    effect: { type: 'multiplier', value: 0.2 },
  },
  {
    id: 'review_efficiency_1',
    name: 'Review Efficiency I',
    description: 'Gain 12% more XP from all sources',
    cost: 250,
    effect: { type: 'multiplier', value: 0.12 },
  },
  {
    id: 'small_furnace',
    name: 'Small Furnace',
    description: 'Generate 0.5 passive XP per second',
    cost: 200,
    effect: { type: 'passive_xp', value: 0.5 },
  },
  {
    id: 'bigger_furnace',
    name: 'Bigger Furnace',
    description: 'Generate an additional 1.5 passive XP per second',
    cost: 800,
    requires: ['small_furnace'],
    effect: { type: 'passive_xp', value: 1.5 },
  },
  {
    id: 'streak_booster',
    name: 'Streak Booster',
    description: 'Double XP gains when streak is 3+ days',
    cost: 400,
    effect: { type: 'multiplier', value: 0 }, // Applied conditionally based on streak
  },
  {
    id: 'mindforge_theme_pack',
    name: 'Mindforge Theme Pack',
    description: 'Unlock exclusive dark theme for the forge',
    cost: 600,
    effect: { type: 'theme', theme: 'mindforge_dark' },
  },
  {
    id: 'auto_collect',
    name: 'Auto-Collect',
    description: 'Automatically collect idle XP (up to 24 hours)',
    cost: 1000,
    effect: { type: 'auto_collect' },
  },
];

/**
 * Mission pool for daily mission generation
 * Each day, 3 unique missions are randomly selected from this pool.
 * 
 * Missions reset at midnight (local time) and progress is tracked automatically
 * via awardXP() calls with the corresponding missionId.
 * 
 * To add a new mission:
 * 1. Add template to this array
 * 2. Call awardXP(baseXP, reason, 'new_mission_id') to track progress
 * 3. Reward is granted when user clicks "Claim" button
 * 
 * See STUDYFORGE.md > Missions section for detailed documentation.
 */
export const MISSION_POOL: MissionTemplate[] = [
  {
    id: 'create_notes',
    title: 'Note Creator',
    description: 'Create 3 notes',
    target: 3,
    reward: 50,
  },
  {
    id: 'generate_flashcards',
    title: 'Flashcard Master',
    description: 'Generate 2 flashcard sets',
    target: 2,
    reward: 60,
  },
  {
    id: 'review_flashcards',
    title: 'Study Session',
    description: 'Review 20 flashcards',
    target: 20,
    reward: 40,
  },
  {
    id: 'earn_xp',
    title: 'XP Hunter',
    description: 'Earn 100 XP from any source',
    target: 100,
    reward: 30,
  },
  {
    id: 'daily_login',
    title: 'Daily Commitment',
    description: 'Log in and interact with the app',
    target: 1,
    reward: 25,
  },
  {
    id: 'study_streak',
    title: 'Consistency Champion',
    description: 'Maintain your study streak',
    target: 1,
    reward: 35,
  },
];

// ============================================================================
// In-Memory State and Event Bus
// ============================================================================

/**
 * In-memory singleton state for fast access
 * Synced with IndexedDB on every mutation
 */
let inMemoryState: StudyForgeRecord | null = null;

/**
 * Event listeners for UI reactivity
 */
const listeners = new Set<EventHandler>();

/**
 * Subscribe to StudyForge events
 * Returns unsubscribe function
 * 
 * Usage:
 * ```typescript
 * const unsubscribe = subscribeStudyForge((event) => {
 *   if (event.type === 'xpAwarded') {
 *     showToast(`+${event.effectiveXP} XP`);
 *   }
 * });
 * ```
 */
export function subscribeStudyForge(handler: EventHandler): () => void {
  listeners.add(handler);
  return () => listeners.delete(handler);
}

/**
 * Emit an event to all subscribers
 */
function emitEvent(event: StudyForgeEvent): void {
  listeners.forEach((handler) => {
    try {
      handler(event);
    } catch (error) {
      console.error('StudyForge: Event handler error:', error);
    }
  });
}

/**
 * Get current in-memory state (read-only)
 * Returns a copy to prevent accidental mutations
 * 
 * Usage:
 * ```typescript
 * const state = getStudyForgeState();
 * if (state) {
 *   console.log(`Level ${state.level}`);
 * }
 * ```
 */
export function getStudyForgeState(): StudyForgeRecord | null {
  return inMemoryState ? { ...inMemoryState } : null;
}

// ============================================================================
// Core Engine Functions
// ============================================================================

/**
 * Calculate the level from total XP using the XP curve formula
 * Formula: XP for level N = 100 * (N^1.5)
 * Uses binary search for efficiency
 * 
 * @param totalXP - Total accumulated XP
 * @returns Current level (minimum 1)
 */
export function getLevelFromTotalXP(totalXP: number): number {
  if (totalXP < XP_BASE) return 1;
  
  // Binary search to find the level
  let low = 1;
  let high = Math.ceil(Math.pow(totalXP / XP_BASE, 1 / XP_EXPONENT)) + 1;
  
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    const xpForMid = Math.floor(XP_BASE * Math.pow(mid, XP_EXPONENT));
    
    if (xpForMid <= totalXP) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }
  
  return low - 1;
}

/**
 * Calculate XP required for a specific level
 * 
 * @param level - Target level
 * @returns XP required to reach that level
 */
export function getXPForLevel(level: number): number {
  return Math.floor(XP_BASE * Math.pow(level, XP_EXPONENT));
}

/**
 * Compute current XP multipliers based on upgrades and streak
 * 
 * @param upgrades - Current upgrade state
 * @param dailyStreak - Current daily streak count
 * @returns Breakdown of multipliers
 */
export function computeMultipliers(
  upgrades: StudyForgeUpgradeState,
  dailyStreak: number
): XPMultipliers {
  const base = 1.0;
  let upgradeMultiplier = 0;
  let streakMultiplier = 0;
  
  // Sum up upgrade multipliers
  for (const upgrade of UPGRADES) {
    if (upgrades[upgrade.id] && upgrade.effect.type === 'multiplier') {
      upgradeMultiplier += upgrade.effect.value || 0;
    }
  }
  
  // Apply streak booster if owned and streak >= 3
  if (upgrades['streak_booster'] && dailyStreak >= 3) {
    streakMultiplier = 1.0; // Double XP (100% bonus)
  }
  
  // Total multiplier is base + sum of bonuses
  const total = base + upgradeMultiplier + streakMultiplier;
  
  return {
    base,
    upgrades: upgradeMultiplier,
    streak: streakMultiplier,
    total,
  };
}

/**
 * Get today's date as YYYY-MM-DD string
 */
function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Check if date string is yesterday
 */
function isYesterday(dateString: string): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  return dateString === yesterdayStr;
}

/**
 * Update daily streak based on last streak date
 * Increments if last activity was yesterday, resets if older, maintains if today
 * 
 * @param lastStreakDate - Last recorded streak date (YYYY-MM-DD)
 * @param currentStreak - Current streak count
 * @returns Updated streak count
 */
function updateStreak(lastStreakDate: string, currentStreak: number): number {
  const today = getTodayDateString();
  
  if (lastStreakDate === today) {
    // Already counted today
    return currentStreak;
  } else if (isYesterday(lastStreakDate)) {
    // Consecutive day - increment streak
    return currentStreak + 1;
  } else {
    // Streak broken - reset to 1
    return 1;
  }
}

/**
 * Seed daily missions - select 3 unique missions from the pool
 * Resets progress and claimed status
 * 
 * @returns Array of 3 daily missions
 */
export function seedDailyMissions(): DailyMission[] {
  // Shuffle mission pool
  const shuffled = [...MISSION_POOL].sort(() => Math.random() - 0.5);
  
  // Take first 3 missions
  const selected = shuffled.slice(0, 3);
  
  // Convert to DailyMission format with progress tracking
  return selected.map((template) => ({
    id: template.id,
    title: template.title,
    description: template.description,
    target: template.target,
    progress: 0,
    reward: template.reward,
    claimed: false,
  }));
}

/**
 * Check if missions need to be reseeded (new day)
 * 
 * @param missionsLastSeededAt - Last seed date (YYYY-MM-DD)
 * @returns True if missions should be reseeded
 */
function shouldReseedMissions(missionsLastSeededAt: string): boolean {
  const today = getTodayDateString();
  return missionsLastSeededAt !== today;
}

/**
 * Initialize StudyForge state
 * Loads from database or creates default state if not exists
 * Also handles idle XP accumulation and daily mission resets
 * 
 * @returns Promise resolving to initialized state
 */
export async function initStudyForge(): Promise<StudyForgeRecord> {
  // SSR guard
  if (typeof window === 'undefined') {
    throw new Error('StudyForge: Cannot initialize during SSR');
  }
  
  let state = await getStudyForge();
  
  if (!state) {
    // Create default state
    const today = getTodayDateString();
    state = {
      id: 1,
      totalXP: 0,
      availableXP: 0,
      level: 1,
      xpForNext: getXPForLevel(2),
      xpProgress: 0,
      pendingIdleXP: 0,
      passiveXPPerSec: 0,
      lastActiveAt: new Date().toISOString(),
      dailyStreak: 0,
      lastStreakDate: '',
      missionsLastSeededAt: today,
      activeMissions: seedDailyMissions(),
      ownedThemes: ['default'],
      upgrades: {},
      settings: {
        theme: 'default',
        autoCollect: false,
        soundEnabled: true,
        notificationsEnabled: true,
      },
      activityLog: [],
    };
    
    await saveStudyForge(state);
    console.log('StudyForge: Initialized with default state');
  } else {
    // State exists - handle idle XP and mission resets
    await addPassiveXPSinceLastActive();
    
    // Reseed missions if new day
    if (shouldReseedMissions(state.missionsLastSeededAt)) {
      state.activeMissions = seedDailyMissions();
      state.missionsLastSeededAt = getTodayDateString();
      await saveStudyForge(state);
      console.log('StudyForge: Reseeded daily missions');
    }
    
    // Refresh in-memory state
    state = await getStudyForge() || state;
  }
  
  inMemoryState = state;
  return state;
}

/**
 * Add passive XP accumulated since last active session
 * Respects Auto-Collect upgrade (24h cap if owned, otherwise just tracks in pendingIdleXP)
 * Updates lastActiveAt timestamp
 * 
 * @returns Promise resolving to amount of XP credited
 */
export async function addPassiveXPSinceLastActive(): Promise<number> {
  if (!inMemoryState) {
    const state = await getStudyForge();
    if (!state) return 0;
    inMemoryState = state;
  }
  
  const now = new Date();
  const lastActive = new Date(inMemoryState.lastActiveAt);
  const elapsedSeconds = Math.floor((now.getTime() - lastActive.getTime()) / 1000);
  
  if (elapsedSeconds <= 0 || inMemoryState.passiveXPPerSec <= 0) {
    // No time elapsed or no passive XP generation
    inMemoryState.lastActiveAt = now.toISOString();
    await saveStudyForge(inMemoryState);
    return 0;
  }
  
  // Calculate total idle XP
  const maxIdleSeconds = 24 * 60 * 60; // 24 hours
  const cappedSeconds = Math.min(elapsedSeconds, maxIdleSeconds);
  const idleXP = Math.floor(cappedSeconds * inMemoryState.passiveXPPerSec);
  
  const hasAutoCollect = inMemoryState.upgrades['auto_collect'];
  
  if (hasAutoCollect) {
    // Auto-collect: credit XP immediately
    inMemoryState.totalXP += idleXP;
    inMemoryState.availableXP += idleXP;
    inMemoryState.pendingIdleXP = 0;
    
    // Check for level up
    const oldLevel = inMemoryState.level;
    const newLevel = getLevelFromTotalXP(inMemoryState.totalXP);
    
    if (newLevel > oldLevel) {
      inMemoryState.level = newLevel;
      inMemoryState.xpForNext = getXPForLevel(newLevel + 1);
      
      // Add level up log
      const levelUpEntry: ActivityLogEntry = {
        timestamp: now.toISOString(),
        type: 'level_up',
        message: `Leveled up to ${newLevel}!`,
        level: newLevel,
      };
      inMemoryState.activityLog = [levelUpEntry, ...inMemoryState.activityLog].slice(0, 10);
      
      emitEvent({ type: 'levelUp', newLevel, totalXP: inMemoryState.totalXP });
    }
    
    // Update progress
    const xpIntoLevel = inMemoryState.totalXP - getXPForLevel(inMemoryState.level);
    const xpForNextLevel = inMemoryState.xpForNext - getXPForLevel(inMemoryState.level);
    inMemoryState.xpProgress = xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0;
    
    // Add log entry
    const idleXPEntry: ActivityLogEntry = {
      timestamp: now.toISOString(),
      type: 'xp_earned',
      message: `Collected ${idleXP} idle XP`,
      xpAmount: idleXP,
    };
    inMemoryState.activityLog = [idleXPEntry, ...inMemoryState.activityLog].slice(0, 10);
    
    console.log(`StudyForge: Auto-collected ${idleXP} idle XP`);
  } else {
    // No auto-collect: store in pendingIdleXP
    inMemoryState.pendingIdleXP += idleXP;
    console.log(`StudyForge: ${idleXP} idle XP pending collection`);
  }
  
  inMemoryState.lastActiveAt = now.toISOString();
  await saveStudyForge(inMemoryState);
  
  return idleXP;
}

/**
 * Award XP with multipliers, level progression, and mission tracking
 * 
 * This is the primary function for granting XP to users. It automatically:
 * - Applies multipliers from upgrades and streaks
 * - Updates daily streak if needed
 * - Checks for level ups and emits events
 * - Tracks mission progress (if missionId provided)
 * - Updates activity log
 * - Syncs to IndexedDB
 * 
 * Usage Example:
 * ```typescript
 * // Award XP after user action
 * await awardXP(15, 'Transform notes', 'create_notes');
 * ```
 * 
 * XP Integration Points (see STUDYFORGE.md for full list):
 * - Transform notes: 15 XP (app/page.tsx)
 * - Save note: 50 XP (components/SmartStructureCard.tsx)
 * - Generate flashcards: 40 XP (app/dashboard/page.tsx)
 * - Save flashcard set: 25 XP (app/flashcards/[id]/page.tsx)
 * - Review flashcard: 10 XP (app/flashcards/[id]/page.tsx)
 * 
 * @param baseXP - Base XP amount before multipliers
 * @param reason - Human-readable reason for XP gain (shown in toasts and logs)
 * @param missionId - Optional mission ID to increment progress (e.g., 'create_notes')
 * @returns Promise resolving to effective XP awarded (after multipliers)
 */
export async function awardXP(
  baseXP: number,
  reason: string,
  missionId?: string
): Promise<number> {
  if (!inMemoryState) {
    await initStudyForge();
    if (!inMemoryState) throw new Error('StudyForge: Failed to initialize');
  }
  
  const now = new Date();
  
  // Update streak
  const newStreak = updateStreak(inMemoryState.lastStreakDate, inMemoryState.dailyStreak);
  const streakChanged = newStreak !== inMemoryState.dailyStreak;
  
  if (streakChanged) {
    inMemoryState.dailyStreak = newStreak;
    inMemoryState.lastStreakDate = getTodayDateString();
  }
  
  // Compute multipliers
  const multipliers = computeMultipliers(inMemoryState.upgrades, inMemoryState.dailyStreak);
  const effectiveXP = Math.floor(baseXP * multipliers.total);
  
  // Add XP
  const oldLevel = inMemoryState.level;
  inMemoryState.totalXP += effectiveXP;
  inMemoryState.availableXP += effectiveXP;
  
  // Check for level up
  const newLevel = getLevelFromTotalXP(inMemoryState.totalXP);
  
  if (newLevel > oldLevel) {
    inMemoryState.level = newLevel;
    inMemoryState.xpForNext = getXPForLevel(newLevel + 1);
    
    // Add level up log entry
    const levelUpEntry: ActivityLogEntry = {
      timestamp: now.toISOString(),
      type: 'level_up',
      message: `Leveled up to ${newLevel}!`,
      level: newLevel,
    };
    inMemoryState.activityLog = [levelUpEntry, ...inMemoryState.activityLog].slice(0, 10);
    
    emitEvent({ type: 'levelUp', newLevel, totalXP: inMemoryState.totalXP });
  }
  
  // Update progress bar
  const xpIntoLevel = inMemoryState.totalXP - getXPForLevel(inMemoryState.level);
  const xpForNextLevel = inMemoryState.xpForNext - getXPForLevel(inMemoryState.level);
  inMemoryState.xpProgress = xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0;
  
  // Add XP gain log entry
  const xpEntry: ActivityLogEntry = {
    timestamp: now.toISOString(),
    type: 'xp_earned',
    message: `${reason} (+${effectiveXP} XP)`,
    xpAmount: effectiveXP,
  };
  inMemoryState.activityLog = [xpEntry, ...inMemoryState.activityLog].slice(0, 10);
  
  // Update mission progress
  if (missionId) {
    for (const mission of inMemoryState.activeMissions) {
      if (mission.id === missionId && !mission.claimed) {
        mission.progress = Math.min(mission.progress + 1, mission.target);
      }
    }
  }
  
  // Special handling for earn_xp mission
  const earnXPMission = inMemoryState.activeMissions.find((m) => m.id === 'earn_xp');
  if (earnXPMission && !earnXPMission.claimed) {
    earnXPMission.progress = Math.min(earnXPMission.progress + effectiveXP, earnXPMission.target);
  }
  
  inMemoryState.lastActiveAt = now.toISOString();
  await saveStudyForge(inMemoryState);
  
  emitEvent({ type: 'xpAwarded', xp: baseXP, effectiveXP, reason });
  
  console.log(
    `StudyForge: Awarded ${effectiveXP} XP (base: ${baseXP}, multiplier: ${multipliers.total.toFixed(2)}x)`
  );
  
  return effectiveXP;
}

/**
 * Purchase an upgrade with availableXP
 * Validates prerequisites, deducts cost, applies effects
 * 
 * @param upgradeId - ID of upgrade to purchase
 * @returns Promise resolving to success boolean
 */
export async function purchaseUpgrade(upgradeId: string): Promise<boolean> {
  if (!inMemoryState) {
    await initStudyForge();
    if (!inMemoryState) throw new Error('StudyForge: Failed to initialize');
  }
  
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) {
    console.error(`StudyForge: Upgrade ${upgradeId} not found`);
    return false;
  }
  
  // Check if already owned
  if (inMemoryState.upgrades[upgradeId]) {
    console.warn(`StudyForge: Upgrade ${upgradeId} already purchased`);
    return false;
  }
  
  // Check prerequisites
  if (upgrade.requires) {
    for (const reqId of upgrade.requires) {
      if (!inMemoryState.upgrades[reqId]) {
        console.warn(`StudyForge: Missing prerequisite ${reqId} for ${upgradeId}`);
        return false;
      }
    }
  }
  
  // Check cost
  if (inMemoryState.availableXP < upgrade.cost) {
    console.warn(`StudyForge: Insufficient XP for ${upgradeId} (need ${upgrade.cost}, have ${inMemoryState.availableXP})`);
    return false;
  }
  
  // Deduct cost
  inMemoryState.availableXP -= upgrade.cost;
  
  // Mark as purchased
  inMemoryState.upgrades[upgradeId] = true;
  
  // Apply effects
  switch (upgrade.effect.type) {
    case 'passive_xp':
      inMemoryState.passiveXPPerSec += upgrade.effect.value || 0;
      break;
    case 'theme':
      if (upgrade.effect.theme && !inMemoryState.ownedThemes.includes(upgrade.effect.theme)) {
        inMemoryState.ownedThemes.push(upgrade.effect.theme);
      }
      break;
    case 'multiplier':
      // Multipliers are calculated dynamically in computeMultipliers
      break;
    case 'auto_collect':
      // Auto-collect is checked dynamically in addPassiveXPSinceLastActive
      break;
  }
  
  // Add log entry
  const upgradeEntry: ActivityLogEntry = {
    timestamp: new Date().toISOString(),
    type: 'upgrade_purchased',
    message: `Purchased ${upgrade.name}`,
  };
  inMemoryState.activityLog = [upgradeEntry, ...inMemoryState.activityLog].slice(0, 10);
  
  await saveStudyForge(inMemoryState);
  
  emitEvent({ type: 'upgradePurchased', upgradeId, name: upgrade.name });
  
  console.log(`StudyForge: Purchased upgrade ${upgrade.name} for ${upgrade.cost} XP`);
  
  return true;
}

/**
 * Claim a completed mission's reward
 * 
 * @param missionId - ID of mission to claim
 * @returns Promise resolving to reward XP amount (0 if failed)
 */
export async function claimMission(missionId: string): Promise<number> {
  if (!inMemoryState) {
    await initStudyForge();
    if (!inMemoryState) throw new Error('StudyForge: Failed to initialize');
  }
  
  const mission = inMemoryState.activeMissions.find((m) => m.id === missionId);
  
  if (!mission) {
    console.warn(`StudyForge: Mission ${missionId} not found`);
    return 0;
  }
  
  if (mission.claimed) {
    console.warn(`StudyForge: Mission ${missionId} already claimed`);
    return 0;
  }
  
  if (mission.progress < mission.target) {
    console.warn(`StudyForge: Mission ${missionId} not complete (${mission.progress}/${mission.target})`);
    return 0;
  }
  
  // Mark as claimed
  mission.claimed = true;
  
  // Award XP (without multipliers for mission rewards)
  inMemoryState.totalXP += mission.reward;
  inMemoryState.availableXP += mission.reward;
  
  // Check for level up
  const oldLevel = inMemoryState.level;
  const newLevel = getLevelFromTotalXP(inMemoryState.totalXP);
  
  if (newLevel > oldLevel) {
    inMemoryState.level = newLevel;
    inMemoryState.xpForNext = getXPForLevel(newLevel + 1);
    
    // Add level up log entry
    const levelUpEntry: ActivityLogEntry = {
      timestamp: new Date().toISOString(),
      type: 'level_up',
      message: `Leveled up to ${newLevel}!`,
      level: newLevel,
    };
    inMemoryState.activityLog = [levelUpEntry, ...inMemoryState.activityLog].slice(0, 10);
    
    emitEvent({ type: 'levelUp', newLevel, totalXP: inMemoryState.totalXP });
  }
  
  // Update progress bar
  const xpIntoLevel = inMemoryState.totalXP - getXPForLevel(inMemoryState.level);
  const xpForNextLevel = inMemoryState.xpForNext - getXPForLevel(inMemoryState.level);
  inMemoryState.xpProgress = xpForNextLevel > 0 ? xpIntoLevel / xpForNextLevel : 0;
  
  // Add log entry
  const missionEntry: ActivityLogEntry = {
    timestamp: new Date().toISOString(),
    type: 'mission_completed',
    message: `Completed mission: ${mission.title} (+${mission.reward} XP)`,
    xpAmount: mission.reward,
  };
  inMemoryState.activityLog = [missionEntry, ...inMemoryState.activityLog].slice(0, 10);
  
  await saveStudyForge(inMemoryState);
  
  emitEvent({ type: 'missionCompleted', missionId, reward: mission.reward });
  
  console.log(`StudyForge: Claimed mission ${mission.title} for ${mission.reward} XP`);
  
  return mission.reward;
}

/**
 * Update user settings
 * 
 * @param settings - Partial settings to update
 * @returns Promise resolving when settings are saved
 */
export async function updateSettings(settings: Partial<StudyForgeSettings>): Promise<void> {
  if (!inMemoryState) {
    await initStudyForge();
    if (!inMemoryState) throw new Error('StudyForge: Failed to initialize');
  }
  
  inMemoryState.settings = {
    ...inMemoryState.settings,
    ...settings,
  };
  
  await saveStudyForge(inMemoryState);
  
  emitEvent({ type: 'settingsChanged', settings: inMemoryState.settings });
  
  console.log('StudyForge: Settings updated');
}

/**
 * Get a specific upgrade definition by ID
 * 
 * @param upgradeId - Upgrade ID to look up
 * @returns Upgrade definition or undefined if not found
 */
export function getUpgrade(upgradeId: string): UpgradeDefinition | undefined {
  return UPGRADES.find((u) => u.id === upgradeId);
}

/**
 * Check if an upgrade can be purchased
 * 
 * @param upgradeId - Upgrade ID to check
 * @returns True if upgrade is available and affordable
 */
export function canPurchaseUpgrade(upgradeId: string): boolean {
  if (!inMemoryState) return false;
  
  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return false;
  
  // Check if already owned
  if (inMemoryState.upgrades[upgradeId]) return false;
  
  // Check prerequisites
  if (upgrade.requires) {
    for (const reqId of upgrade.requires) {
      if (!inMemoryState.upgrades[reqId]) return false;
    }
  }
  
  // Check cost
  return inMemoryState.availableXP >= upgrade.cost;
}
