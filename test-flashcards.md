# Flashcard Database Testing Guide

## Browser Console Test Script

Open the application in a browser (http://localhost:3000), open the DevTools console (F12), and paste the following:

```javascript
// Import the database functions
import {
  saveFlashcardSet,
  getFlashcardSet,
  listFlashcardSets,
  deleteFlashcardSet
} from './lib/db.js';

// Test 1: Save a flashcard set
console.log('=== Test 1: Save flashcard set ===');
const testSet1 = {
  subject: 'Programming',
  topic: 'React Hooks',
  difficulty: 'intermediate',
  createdAt: new Date().toISOString(),
  cards: [
    { front: 'What is useState?', back: 'A Hook for managing state in functional components' },
    { front: 'What is useEffect?', back: 'A Hook for performing side effects' },
    { front: 'What is useContext?', back: 'A Hook for consuming context values' },
  ]
};

const id1 = await saveFlashcardSet(testSet1);
console.log('✅ Saved flashcard set with ID:', id1);

// Test 2: Get the flashcard set
console.log('\n=== Test 2: Get flashcard set ===');
const retrieved = await getFlashcardSet(id1);
console.log('✅ Retrieved set:', retrieved);
console.log(`   Topic: ${retrieved.topic}`);
console.log(`   Cards: ${retrieved.cards.length}`);

// Test 3: Save another flashcard set with noteId
console.log('\n=== Test 3: Save another set with noteId ===');
const testSet2 = {
  noteId: 123,
  subject: 'Mathematics',
  topic: 'Calculus',
  difficulty: 'advanced',
  createdAt: new Date().toISOString(),
  cards: [
    { front: 'What is a derivative?', back: 'The rate of change of a function' },
    { front: 'What is an integral?', back: 'The accumulation of a function over an interval' },
  ]
};

const id2 = await saveFlashcardSet(testSet2);
console.log('✅ Saved second set with ID:', id2);

// Test 4: List all flashcard sets
console.log('\n=== Test 4: List all flashcard sets ===');
const allSets = await listFlashcardSets();
console.log(`✅ Found ${allSets.length} flashcard sets`);
allSets.forEach((set, idx) => {
  console.log(`   ${idx + 1}. ${set.topic} (${set.cards.length} cards, ID: ${set.id})`);
});

// Test 5: List with pagination
console.log('\n=== Test 5: List with pagination (limit 1) ===');
const limitedSets = await listFlashcardSets({ limit: 1 });
console.log(`✅ Retrieved ${limitedSets.length} set(s) with limit`);
console.log('   First set:', limitedSets[0]?.topic);

// Test 6: Filter by noteId
console.log('\n=== Test 6: Filter by noteId ===');
const noteSets = await listFlashcardSets({ noteId: 123 });
console.log(`✅ Found ${noteSets.length} set(s) for noteId 123`);
noteSets.forEach(set => {
  console.log(`   - ${set.topic} (noteId: ${set.noteId})`);
});

// Test 7: Delete a flashcard set
console.log('\n=== Test 7: Delete flashcard set ===');
await deleteFlashcardSet(id1);
console.log(`✅ Deleted flashcard set ${id1}`);

// Verify deletion
const remaining = await listFlashcardSets();
console.log(`   Remaining sets: ${remaining.length}`);

console.log('\n✅ All tests completed successfully!');
```

## Simple Console Test (Manual Steps)

1. Open http://localhost:3000 in your browser
2. Open DevTools console (F12)
3. Run these commands one by one:

```javascript
// Get the database module
const db = await import('/lib/db.js');

// Save a flashcard set
const id = await db.saveFlashcardSet({
  subject: 'Programming',
  topic: 'React Hooks',
  difficulty: 'intermediate',
  createdAt: new Date().toISOString(),
  cards: [
    { front: 'What is useState?', back: 'A Hook for state' },
    { front: 'What is useEffect?', back: 'A Hook for side effects' }
  ]
});
console.log('Saved with ID:', id);

// List all sets
const sets = await db.listFlashcardSets();
console.log('Total sets:', sets.length);
console.log('Sets:', sets);

// Get a specific set
const set = await db.getFlashcardSet(id);
console.log('Retrieved set:', set);

// Delete the set
await db.deleteFlashcardSet(id);
console.log('Deleted set:', id);

// Verify deletion
const remaining = await db.listFlashcardSets();
console.log('Remaining sets:', remaining.length);
```

## Expected Console Output

You should see console logs like:
```
FlashcardSets: Saved flashcard set with ID 1 (2 cards)
Saved with ID: 1
FlashcardSets: Retrieved 1 flashcard sets
Total sets: 1
Sets: [{id: 1, subject: "Programming", topic: "React Hooks", ...}]
FlashcardSets: Retrieved flashcard set 1
Retrieved set: {id: 1, subject: "Programming", topic: "React Hooks", ...}
FlashcardSets: Deleted flashcard set 1
Deleted set: 1
FlashcardSets: Retrieved 0 flashcard sets
Remaining sets: 0
```

## Database Verification

To verify the database structure in the browser console:

```javascript
// Check the database instance
const db = await import('/lib/db.js');
const dbInstance = db.getNotesDB();

// Inspect tables
console.log('Tables:', dbInstance.tables.map(t => t.name));
// Should show: ['notes', 'flashcardSets']

// Check flashcardSets table schema
const schema = dbInstance.flashcardSets.schema;
console.log('FlashcardSets indexes:', schema.indexes);
// Should show: id, noteId, createdAt

// Verify version
console.log('Database version:', dbInstance.verno);
// Should show: 2
```

## Automated Test Page

Visit http://localhost:3000/test-flashcards to run automated tests with a visual interface.
