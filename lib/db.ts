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
 * Analytics result interface for dashboard consumption
 */
export interface NotesAnalytics {
  totalNotes: number;
  bySubject: Record<string, number>;
  byDifficulty: Record<'beginner' | 'intermediate' | 'advanced', number>;
  byTags: Record<string, number>;
  recentNotes: number; // notes created in last 7 days
}

/**
 * NotesDB is a typed Dexie database for managing notes
 * 
 * Schema:
 * - ++id: Auto-incremented primary key
 * - timestamp: Indexed for time-based queries
 * - subject: Indexed for filtering by category
 * - topic: Indexed for filtering by specific topic
 * - difficulty: Indexed for filtering by learning level
 * - tags: Multi-entry index for tag-based search
 */
export class NotesDB extends Dexie {
  notes!: Table<NoteRecord, number>;

  constructor() {
    super('NotesDB');
    
    // Define schema version 1
    // Multi-entry index on tags allows querying by any tag in the array
    this.version(1).stores({
      notes: '++id, timestamp, subject, topic, difficulty, *tags',
    });

    this.notes = this.table('notes');
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
