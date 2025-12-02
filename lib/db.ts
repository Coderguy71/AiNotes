'use client';

import Dexie, { Table } from 'dexie';

/**
 * NoteRecord represents a saved note in the database
 * 
 * @property id - Auto-incremented primary key
 * @property timestamp - Creation timestamp (ISO string)
 * @property rawText - Original unformatted user input
 * @property transformedText - AI-generated formatted output
 * @property subject - Broad category (e.g., "Mathematics", "Programming")
 * @property topic - Specific topic within the subject
 * @property difficulty - Learning level: beginner, intermediate, or advanced
 * @property tags - Array of relevant keywords for searchability
 */
export interface NoteRecord {
  id?: number;
  timestamp: string;
  rawText: string;
  transformedText: string;
  subject: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

/**
 * FlashcardCard represents a single flashcard with front (question) and back (answer)
 * 
 * @property front - Question or prompt on the front of the card
 * @property back - Answer or explanation on the back of the card
 */
export interface FlashcardCard {
  front: string;
  back: string;
}

/**
 * FlashcardSet represents a collection of flashcards stored in the database
 * 
 * @property id - Auto-incremented primary key
 * @property noteId - Optional reference to the note that generated these flashcards
 * @property subject - Broad category (e.g., "Mathematics", "Programming")
 * @property topic - Specific topic within the subject
 * @property difficulty - Learning level: beginner, intermediate, or advanced
 * @property createdAt - Creation timestamp (ISO string)
 * @property cards - Array of flashcard objects (front/back pairs)
 */
export interface FlashcardSet {
  id?: number;
  noteId?: number;
  subject: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  cards: FlashcardCard[];
}

/**
 * Analytics result interface for dashboard consumption
 */
export interface NotesAnalytics {
  totalNotes: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<'beginner' | 'intermediate' | 'advanced', number>;
  byTags: Record<string, number>;
  recentNotes: number; // notes created in last 7 days
}

// ============================================================================
// StudyForge Interfaces
// ============================================================================

/**
 * ActivityLogEntry represents a single event in the StudyForge activity log
 * 
 * @property timestamp - ISO string when the event occurred
 * @property type - Type of activity (xp_earned, level_up, upgrade_purchased, mission_completed)
 * @property message - Human-readable description
 * @property xpAmount - XP amount (for xp_earned events)
 * @property level - Level achieved (for level_up events)
 */
export interface ActivityLogEntry {
  timestamp: string;
  type: 'xp_earned' | 'level_up' | 'upgrade_purchased' | 'mission_completed';
  message: string;
  xpAmount?: number;
  level?: number;
}

/**
 * StudyForgeSettings for user preferences
 * 
 * @property theme - Selected theme name (default: 'default')
 * @property autoCollect - Whether to auto-collect idle XP (default: false)
 * @property soundEnabled - Whether to enable sound effects (default: true)
 * @property notificationsEnabled - Whether to show notifications (default: true)
 */
export interface StudyForgeSettings {
  theme: string;
  autoCollect: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

/**
 * StudyForgeUpgradeState tracks which upgrades have been purchased
 * 
 * Keys are upgrade IDs (e.g., "note_mastery_1", "flashcard_grinder_1")
 * Values are true if purchased, false otherwise
 */
export interface StudyForgeUpgradeState {
  [upgradeId: string]: boolean;
}

/**
 * DailyMission represents a daily task for the user to complete
 * 
 * @property id - Unique mission ID (e.g., "create_notes", "generate_flashcards")
 * @property title - Mission title
 * @property description - Mission description
 * @property target - Target value to reach (e.g., 5 notes)
 * @property progress - Current progress (0 to target)
 * @property reward - XP reward for completion
 * @property claimed - Whether the reward has been claimed
 */
export interface DailyMission {
  id: string;
  title: string;
  description: string;
  target: number;
  progress: number;
  reward: number;
  claimed: boolean;
}

/**
 * StudyForgeRecord represents the single StudyForge state row in the database
 * 
 * @property id - Always 1 (singleton pattern)
 * @property totalXP - Cumulative XP earned (never decreases)
 * @property availableXP - XP available to spend on upgrades
 * @property level - Current level (derived from totalXP)
 * @property xpForNext - XP required to reach next level
 * @property xpProgress - Current progress toward next level (0-1)
 * @property pendingIdleXP - Idle XP accumulated but not yet collected
 * @property passiveXPPerSec - Passive XP generation rate (per second)
 * @property lastActiveAt - ISO string of last activity timestamp
 * @property dailyStreak - Current daily streak count
 * @property lastStreakDate - ISO date string (YYYY-MM-DD) of last streak day
 * @property missionsLastSeededAt - ISO date string when missions were last seeded
 * @property activeMissions - Array of current daily missions
 * @property ownedThemes - Array of unlocked theme names
 * @property upgrades - Map of purchased upgrades
 * @property settings - User preferences
 * @property activityLog - Recent activity history (max 10 entries)
 */
export interface StudyForgeRecord {
  id?: number;
  totalXP: number;
  availableXP: number;
  level: number;
  xpForNext: number;
  xpProgress: number;
  pendingIdleXP: number;
  passiveXPPerSec: number;
  lastActiveAt: string;
  dailyStreak: number;
  lastStreakDate: string;
  missionsLastSeededAt: string;
  activeMissions: DailyMission[];
  ownedThemes: string[];
  upgrades: StudyForgeUpgradeState;
  settings: StudyForgeSettings;
  activityLog: ActivityLogEntry[];
}

/**
 * NotesDB is a typed Dexie database for managing notes, flashcard sets, and StudyForge state
 * 
 * Schema v1:
 * - notes table: ++id, timestamp, subject, topic, difficulty, *tags
 * 
 * Schema v2:
 * - notes table: unchanged (preserves existing data)
 * - flashcardSets table: ++id, noteId, createdAt
 * 
 * Schema v3:
 * - notes table: unchanged (preserves existing data)
 * - flashcardSets table: unchanged (preserves existing data)
 * - studyForge table: ++id (singleton with id=1)
 */
export class NotesDB extends Dexie {
  notes!: Table<NoteRecord, number>;
  flashcardSets!: Table<FlashcardSet, number>;
  studyForge!: Table<StudyForgeRecord, number>;

  constructor() {
    super('NotesDB');
    
    // Define schema version 1
    // Multi-entry index on tags allows querying by any tag in the array
    this.version(1).stores({
      notes: '++id, timestamp, subject, topic, difficulty, *tags',
    });

    // Define schema version 2
    // Add flashcardSets table while keeping notes table unchanged
    this.version(2).stores({
      notes: '++id, timestamp, subject, topic, difficulty, *tags',
      flashcardSets: '++id, noteId, createdAt',
    });

    // Define schema version 3
    // Add studyForge table (singleton) while keeping other tables unchanged
    this.version(3).stores({
      notes: '++id, timestamp, subject, topic, difficulty, *tags',
      flashcardSets: '++id, noteId, createdAt',
      studyForge: '++id',
    });

    this.notes = this.table('notes');
    this.flashcardSets = this.table('flashcardSets');
    this.studyForge = this.table('studyForge');
  }
}

// Create singleton instance with SSR guard
let dbInstance: NotesDB | null = null;

/**
 * Get the database instance (singleton pattern)
 * Returns null during SSR to prevent "window is not defined" errors
 */
function getDB(): NotesDB | null {
  // SSR guard: Dexie requires browser environment
  if (typeof window === 'undefined') {
    console.warn('NotesDB: Attempted to access database during SSR');
    return null;
  }
  
  if (!dbInstance) {
    dbInstance = new NotesDB();
  }
  
  return dbInstance;
}

/**
 * Save a new note to the database
 * 
 * Usage:
 * ```typescript
 * const id = await saveNote({
 *   timestamp: new Date().toISOString(),
 *   rawText: "User's original input",
 *   transformedText: "AI-formatted output",
 *   subject: "Programming",
 *   topic: "React Hooks",
 *   difficulty: "intermediate",
 *   tags: ["react", "hooks", "useState", "useEffect"]
 * });
 * ```
 * 
 * @param note - NoteRecord without id (will be auto-generated)
 * @returns Promise resolving to the new note's ID, or null during SSR
 */
export async function saveNote(
  note: Omit<NoteRecord, 'id'>
): Promise<number | null> {
  const db = getDB();
  if (!db) return null;
  
  try {
    const id = await db.notes.add(note as NoteRecord);
    console.log(`NotesDB: Saved note with ID ${id}`);
    return id;
  } catch (error) {
    console.error('NotesDB: Failed to save note:', error);
    throw error;
  }
}

/**
 * Retrieve notes with optional filtering and pagination
 * 
 * Usage:
 * ```typescript
 * // Get all notes
 * const allNotes = await getNotes();
 * 
 * // Get notes by subject
 * const mathNotes = await getNotes({ subject: "Mathematics" });
 * 
 * // Get notes with pagination
 * const recentNotes = await getNotes({ limit: 10, offset: 0 });
 * 
 * // Combine filters
 * const filtered = await getNotes({
 *   subject: "Programming",
 *   difficulty: "beginner",
 *   limit: 20
 * });
 * ```
 * 
 * @param options - Optional filters and pagination
 * @returns Promise resolving to array of notes, or empty array during SSR
 */
export async function getNotes(options?: {
  subject?: string;
  topic?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tag?: string;
  limit?: number;
  offset?: number;
}): Promise<NoteRecord[]> {
  const db = getDB();
  if (!db) return [];
  
  try {
    let query = db.notes.orderBy('timestamp').reverse();
    
    // Apply filters
    if (options?.subject) {
      query = query.filter((note) => note.subject === options.subject);
    }
    if (options?.topic) {
      query = query.filter((note) => note.topic === options.topic);
    }
    if (options?.difficulty) {
      query = query.filter((note) => note.difficulty === options.difficulty);
    }
    if (options?.tag) {
      const tagToFilter = options.tag;
      query = query.filter((note) => note.tags.includes(tagToFilter));
    }
    
    // Apply pagination
    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    
    const notes = await query.toArray();
    console.log(`NotesDB: Retrieved ${notes.length} notes`);
    return notes;
  } catch (error) {
    console.error('NotesDB: Failed to get notes:', error);
    throw error;
  }
}

/**
 * Get a single note by ID
 * 
 * Usage:
 * ```typescript
 * const note = await getNoteById(42);
 * if (note) {
 *   console.log(note.subject, note.topic);
 * }
 * ```
 * 
 * @param id - Note ID
 * @returns Promise resolving to note or undefined if not found, or null during SSR
 */
export async function getNoteById(id: number): Promise<NoteRecord | undefined | null> {
  const db = getDB();
  if (!db) return null;
  
  try {
    const note = await db.notes.get(id);
    return note;
  } catch (error) {
    console.error(`NotesDB: Failed to get note ${id}:`, error);
    throw error;
  }
}

/**
 * Update an existing note
 * 
 * Usage:
 * ```typescript
 * await updateNote(42, {
 *   transformedText: "Updated AI-formatted output",
 *   tags: ["updated", "tags"]
 * });
 * ```
 * 
 * @param id - Note ID to update
 * @param updates - Partial note data to update
 * @returns Promise resolving to number of updated records (0 or 1), or null during SSR
 */
export async function updateNote(
  id: number,
  updates: Partial<Omit<NoteRecord, 'id'>>
): Promise<number | null> {
  const db = getDB();
  if (!db) return null;
  
  try {
    const count = await db.notes.update(id, updates);
    console.log(`NotesDB: Updated note ${id}, affected rows: ${count}`);
    return count;
  } catch (error) {
    console.error(`NotesDB: Failed to update note ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a note by ID
 * 
 * Usage:
 * ```typescript
 * await deleteNote(42);
 * ```
 * 
 * @param id - Note ID to delete
 * @returns Promise resolving when deletion is complete, or immediately during SSR
 */
export async function deleteNote(id: number): Promise<void> {
  const db = getDB();
  if (!db) return;
  
  try {
    await db.notes.delete(id);
    console.log(`NotesDB: Deleted note ${id}`);
  } catch (error) {
    console.error(`NotesDB: Failed to delete note ${id}:`, error);
    throw error;
  }
}

/**
 * Delete multiple notes by IDs (bulk delete)
 * 
 * Usage:
 * ```typescript
 * await deleteNotes([1, 2, 3, 4, 5]);
 * ```
 * 
 * @param ids - Array of note IDs to delete
 * @returns Promise resolving when deletions are complete, or immediately during SSR
 */
export async function deleteNotes(ids: number[]): Promise<void> {
  const db = getDB();
  if (!db) return;
  
  try {
    await db.notes.bulkDelete(ids);
    console.log(`NotesDB: Deleted ${ids.length} notes`);
  } catch (error) {
    console.error('NotesDB: Failed to bulk delete notes:', error);
    throw error;
  }
}

/**
 * Get the most recent notes (defaults to 10)
 * 
 * Usage:
 * ```typescript
 * const latest = await getLatestNotes(5);
 * ```
 * 
 * @param limit - Number of notes to retrieve (default: 10)
 * @returns Promise resolving to array of recent notes, or empty array during SSR
 */
export async function getLatestNotes(limit: number = 10): Promise<NoteRecord[]> {
  return getNotes({ limit });
}

/**
 * Search notes by text content (searches both rawText and transformedText)
 * 
 * Usage:
 * ```typescript
 * const results = await searchNotes("react hooks");
 * ```
 * 
 * @param query - Search query string
 * @param limit - Maximum number of results (default: 50)
 * @returns Promise resolving to array of matching notes, or empty array during SSR
 */
export async function searchNotes(
  query: string,
  limit: number = 50
): Promise<NoteRecord[]> {
  const db = getDB();
  if (!db) return [];
  
  const lowerQuery = query.toLowerCase();
  
  try {
    const notes = await db.notes
      .orderBy('timestamp')
      .reverse()
      .filter(
        (note) =>
          note.rawText.toLowerCase().includes(lowerQuery) ||
          note.transformedText.toLowerCase().includes(lowerQuery) ||
          note.subject.toLowerCase().includes(lowerQuery) ||
          note.topic.toLowerCase().includes(lowerQuery) ||
          note.tags.some((tag) => tag.toLowerCase().includes(lowerQuery))
      )
      .limit(limit)
      .toArray();
    
    console.log(`NotesDB: Search for "${query}" found ${notes.length} results`);
    return notes;
  } catch (error) {
    console.error('NotesDB: Search failed:', error);
    throw error;
  }
}

/**
 * Get comprehensive analytics for dashboard display
 * This helper aggregates data to avoid duplicating counting logic in components
 * 
 * Usage:
 * ```typescript
 * const analytics = await getNotesAnalytics();
 * console.log(`Total notes: ${analytics.totalNotes}`);
 * console.log(`Math notes: ${analytics.bySubject['Mathematics'] || 0}`);
 * console.log(`Beginner notes: ${analytics.byDifficulty.beginner}`);
 * ```
 * 
 * @returns Promise resolving to analytics object with aggregated counts
 */
export async function getNotesAnalytics(): Promise<NotesAnalytics> {
  const db = getDB();
  
  // Return empty analytics during SSR
  if (!db) {
    return {
      totalNotes: 0,
      bySubject: {},
      byDifficulty: { beginner: 0, intermediate: 0, advanced: 0 },
      byTags: {},
      recentNotes: 0,
    };
  }
  
  try {
    const allNotes = await db.notes.toArray();
    
    // Calculate date 7 days ago for "recent" notes
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString();
    
    // Initialize counters
    const bySubject: Record<string, number> = {};
    const byDifficulty: Record<'beginner' | 'intermediate' | 'advanced', number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
    };
    const byTags: Record<string, number> = {};
    let recentNotes = 0;
    
    // Aggregate data in a single pass
    for (const note of allNotes) {
      // Count by subject
      bySubject[note.subject] = (bySubject[note.subject] || 0) + 1;
      
      // Count by difficulty
      byDifficulty[note.difficulty]++;
      
      // Count by tags
      for (const tag of note.tags) {
        byTags[tag] = (byTags[tag] || 0) + 1;
      }
      
      // Count recent notes (last 7 days)
      if (note.timestamp >= sevenDaysAgoISO) {
        recentNotes++;
      }
    }
    
    console.log(`NotesDB: Analytics calculated for ${allNotes.length} notes`);
    
    return {
      totalNotes: allNotes.length,
      bySubject,
      byDifficulty,
      byTags,
      recentNotes,
    };
  } catch (error) {
    console.error('NotesDB: Failed to get analytics:', error);
    throw error;
  }
}

/**
 * Get notes grouped by subject with counts
 * Useful for displaying subject-based navigation or filters
 * 
 * Usage:
 * ```typescript
 * const subjects = await getSubjectSummary();
 * subjects.forEach(({ subject, count }) => {
 *   console.log(`${subject}: ${count} notes`);
 * });
 * ```
 * 
 * @returns Promise resolving to array of subject summaries with counts
 */
export async function getSubjectSummary(): Promise<
  Array<{ subject: string; count: number }>
> {
  const db = getDB();
  if (!db) return [];
  
  try {
    const allNotes = await db.notes.toArray();
    const subjectCounts = new Map<string, number>();
    
    for (const note of allNotes) {
      subjectCounts.set(note.subject, (subjectCounts.get(note.subject) || 0) + 1);
    }
    
    const summary = Array.from(subjectCounts.entries())
      .map(([subject, count]) => ({ subject, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    return summary;
  } catch (error) {
    console.error('NotesDB: Failed to get subject summary:', error);
    throw error;
  }
}

/**
 * Get all unique tags across all notes with usage counts
 * Useful for tag cloud displays or filter options
 * 
 * Usage:
 * ```typescript
 * const tags = await getTagsSummary();
 * tags.forEach(({ tag, count }) => {
 *   console.log(`#${tag}: used ${count} times`);
 * });
 * ```
 * 
 * @param minCount - Minimum usage count to include (default: 1)
 * @returns Promise resolving to array of tag summaries with counts
 */
export async function getTagsSummary(
  minCount: number = 1
): Promise<Array<{ tag: string; count: number }>> {
  const db = getDB();
  if (!db) return [];
  
  try {
    const allNotes = await db.notes.toArray();
    const tagCounts = new Map<string, number>();
    
    for (const note of allNotes) {
      for (const tag of note.tags) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    
    const summary = Array.from(tagCounts.entries())
      .filter(([, count]) => count >= minCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count); // Sort by count descending
    
    return summary;
  } catch (error) {
    console.error('NotesDB: Failed to get tags summary:', error);
    throw error;
  }
}

/**
 * Clear all notes from the database (use with caution!)
 * 
 * Usage:
 * ```typescript
 * if (confirm("Are you sure you want to delete all notes?")) {
 *   await clearAllNotes();
 * }
 * ```
 * 
 * @returns Promise resolving when all notes are deleted
 */
export async function clearAllNotes(): Promise<void> {
  const db = getDB();
  if (!db) return;
  
  try {
    await db.notes.clear();
    console.log('NotesDB: Cleared all notes');
  } catch (error) {
    console.error('NotesDB: Failed to clear all notes:', error);
    throw error;
  }
}

// ============================================================================
// Flashcard Set Operations
// ============================================================================

/**
 * Save a new flashcard set to the database
 * 
 * Usage:
 * ```typescript
 * const id = await saveFlashcardSet({
 *   noteId: 42, // optional
 *   subject: "Programming",
 *   topic: "React Hooks",
 *   difficulty: "intermediate",
 *   createdAt: new Date().toISOString(),
 *   cards: [
 *     { front: "What is useState?", back: "A React Hook for managing state" },
 *     { front: "What is useEffect?", back: "A Hook for side effects" }
 *   ]
 * });
 * ```
 * 
 * @param flashcardSet - FlashcardSet without id (will be auto-generated)
 * @returns Promise resolving to the new flashcard set's ID, or null during SSR
 */
export async function saveFlashcardSet(
  flashcardSet: Omit<FlashcardSet, 'id'>
): Promise<number | null> {
  const db = getDB();
  if (!db) {
    console.warn('FlashcardSets: Cannot save during SSR');
    return null;
  }
  
  try {
    const id = await db.flashcardSets.add(flashcardSet as FlashcardSet);
    console.log(`FlashcardSets: Saved flashcard set with ID ${id} (${flashcardSet.cards.length} cards)`);
    return id;
  } catch (error) {
    console.error('FlashcardSets: Failed to save flashcard set:', error);
    throw error;
  }
}

/**
 * Get a single flashcard set by ID
 * 
 * Usage:
 * ```typescript
 * const set = await getFlashcardSet(42);
 * if (set) {
 *   console.log(`${set.topic}: ${set.cards.length} cards`);
 * }
 * ```
 * 
 * @param id - Flashcard set ID
 * @returns Promise resolving to flashcard set or undefined if not found, or null during SSR
 */
export async function getFlashcardSet(id: number): Promise<FlashcardSet | undefined | null> {
  const db = getDB();
  if (!db) {
    console.warn('FlashcardSets: Cannot get during SSR');
    return null;
  }
  
  try {
    const set = await db.flashcardSets.get(id);
    if (set) {
      console.log(`FlashcardSets: Retrieved flashcard set ${id}`);
    }
    return set;
  } catch (error) {
    console.error(`FlashcardSets: Failed to get flashcard set ${id}:`, error);
    throw error;
  }
}

/**
 * List flashcard sets sorted by creation date (newest first) with optional pagination
 * 
 * Usage:
 * ```typescript
 * // Get all flashcard sets
 * const allSets = await listFlashcardSets();
 * 
 * // Get first 10 sets
 * const recentSets = await listFlashcardSets({ limit: 10 });
 * 
 * // Get next page
 * const nextPage = await listFlashcardSets({ limit: 10, offset: 10 });
 * 
 * // Filter by note ID
 * const noteSets = await listFlashcardSets({ noteId: 42 });
 * ```
 * 
 * @param options - Optional filters and pagination
 * @returns Promise resolving to array of flashcard sets, or empty array during SSR
 */
export async function listFlashcardSets(options?: {
  noteId?: number;
  limit?: number;
  offset?: number;
}): Promise<FlashcardSet[]> {
  const db = getDB();
  if (!db) {
    console.warn('FlashcardSets: Cannot list during SSR');
    return [];
  }
  
  try {
    let query = db.flashcardSets.orderBy('createdAt').reverse();
    
    // Apply noteId filter if specified
    if (options?.noteId !== undefined) {
      query = query.filter((set) => set.noteId === options.noteId);
    }
    
    // Apply pagination
    if (options?.offset !== undefined) {
      query = query.offset(options.offset);
    }
    if (options?.limit !== undefined) {
      query = query.limit(options.limit);
    }
    
    const sets = await query.toArray();
    console.log(`FlashcardSets: Retrieved ${sets.length} flashcard sets`);
    return sets;
  } catch (error) {
    console.error('FlashcardSets: Failed to list flashcard sets:', error);
    throw error;
  }
}

/**
 * Delete a flashcard set by ID
 * 
 * Usage:
 * ```typescript
 * await deleteFlashcardSet(42);
 * ```
 * 
 * @param id - Flashcard set ID to delete
 * @returns Promise resolving when deletion is complete, or immediately during SSR
 */
export async function deleteFlashcardSet(id: number): Promise<void> {
  const db = getDB();
  if (!db) {
    console.warn('FlashcardSets: Cannot delete during SSR');
    return;
  }
  
  try {
    await db.flashcardSets.delete(id);
    console.log(`FlashcardSets: Deleted flashcard set ${id}`);
  } catch (error) {
    console.error(`FlashcardSets: Failed to delete flashcard set ${id}:`, error);
    throw error;
  }
}

// ============================================================================
// StudyForge Operations
// ============================================================================

/**
 * Get the StudyForge state from the database (singleton pattern)
 * Always uses id=1 as there's only one StudyForge state per user
 * 
 * Usage:
 * ```typescript
 * const state = await getStudyForge();
 * if (state) {
 *   console.log(`Level ${state.level}, ${state.totalXP} XP`);
 * }
 * ```
 * 
 * @returns Promise resolving to StudyForge state or undefined if not initialized, or null during SSR
 */
export async function getStudyForge(): Promise<StudyForgeRecord | undefined | null> {
  const db = getDB();
  if (!db) {
    console.warn('StudyForge: Cannot get during SSR');
    return null;
  }
  
  try {
    const state = await db.studyForge.get(1);
    if (state) {
      console.log('StudyForge: Retrieved state from database');
    }
    return state;
  } catch (error) {
    console.error('StudyForge: Failed to get state:', error);
    throw error;
  }
}

/**
 * Save or update the StudyForge state in the database
 * Uses upsert pattern - creates with id=1 if not exists, updates if exists
 * 
 * Usage:
 * ```typescript
 * await saveStudyForge({
 *   id: 1,
 *   totalXP: 1000,
 *   availableXP: 500,
 *   level: 5,
 *   // ... other fields
 * });
 * ```
 * 
 * @param state - Complete StudyForge state object
 * @returns Promise resolving when save is complete, or immediately during SSR
 */
export async function saveStudyForge(state: StudyForgeRecord): Promise<void> {
  const db = getDB();
  if (!db) {
    console.warn('StudyForge: Cannot save during SSR');
    return;
  }
  
  try {
    // Ensure id is always 1 (singleton pattern)
    const stateWithId = { ...state, id: 1 };
    await db.studyForge.put(stateWithId);
    console.log('StudyForge: Saved state to database');
  } catch (error) {
    console.error('StudyForge: Failed to save state:', error);
    throw error;
  }
}

/**
 * Log a StudyForge activity event
 * Automatically appends to the activity log and keeps only the last 10 entries
 * 
 * Usage:
 * ```typescript
 * await logStudyEvent({
 *   timestamp: new Date().toISOString(),
 *   type: 'xp_earned',
 *   message: 'Earned 50 XP from creating a note',
 *   xpAmount: 50
 * });
 * ```
 * 
 * @param entry - Activity log entry to append
 * @returns Promise resolving when log is saved, or immediately during SSR
 */
export async function logStudyEvent(entry: ActivityLogEntry): Promise<void> {
  const db = getDB();
  if (!db) {
    console.warn('StudyForge: Cannot log event during SSR');
    return;
  }
  
  try {
    const state = await db.studyForge.get(1);
    if (!state) {
      console.warn('StudyForge: Cannot log event - state not initialized');
      return;
    }
    
    // Add new entry and keep only last 10
    const updatedLog = [entry, ...state.activityLog].slice(0, 10);
    
    await db.studyForge.update(1, {
      activityLog: updatedLog,
    });
    
    console.log(`StudyForge: Logged ${entry.type} event`);
  } catch (error) {
    console.error('StudyForge: Failed to log event:', error);
    throw error;
  }
}

/**
 * Export the database instance for advanced usage
 * Note: Always check for null before using (SSR guard)
 * 
 * Usage:
 * ```typescript
 * const db = getNotesDB();
 * if (db) {
 *   // Advanced Dexie queries
 *   const count = await db.notes.where('difficulty').equals('advanced').count();
 * }
 * ```
 */
export function getNotesDB(): NotesDB | null {
  return getDB();
}

/**
 * Export the NotesDB class for type definitions and testing
 */
export { NotesDB as default };
