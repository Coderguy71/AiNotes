'use client';

import { useEffect, useState } from 'react';
import {
  saveFlashcardSet,
  getFlashcardSet,
  listFlashcardSets,
  deleteFlashcardSet,
  type FlashcardSet,
} from '@/lib/db';

export default function TestFlashcardsPage() {
  const [results, setResults] = useState<string[]>([]);
  const [sets, setSets] = useState<FlashcardSet[]>([]);

  const log = (message: string) => {
    console.log(message);
    setResults((prev) => [...prev, message]);
  };

  const runTests = async () => {
    setResults([]);
    log('Starting flashcard tests...');

    try {
      // Test 1: Save a flashcard set
      log('\n=== Test 1: Save flashcard set ===');
      const testSet = {
        subject: 'Programming',
        topic: 'React Hooks',
        difficulty: 'intermediate' as const,
        createdAt: new Date().toISOString(),
        cards: [
          { front: 'What is useState?', back: 'A Hook for managing state in functional components' },
          { front: 'What is useEffect?', back: 'A Hook for performing side effects' },
          { front: 'What is useContext?', back: 'A Hook for consuming context values' },
        ],
      };
      
      const id = await saveFlashcardSet(testSet);
      log(`✅ Saved flashcard set with ID: ${id}`);

      // Test 2: Get the flashcard set
      log('\n=== Test 2: Get flashcard set ===');
      if (id) {
        const retrieved = await getFlashcardSet(id);
        if (retrieved) {
          log(`✅ Retrieved set: ${retrieved.topic} (${retrieved.cards.length} cards)`);
          log(`   Subject: ${retrieved.subject}`);
          log(`   Difficulty: ${retrieved.difficulty}`);
        } else {
          log('❌ Failed to retrieve set');
        }
      }

      // Test 3: Save another flashcard set
      log('\n=== Test 3: Save another set ===');
      const testSet2 = {
        noteId: 123,
        subject: 'Mathematics',
        topic: 'Calculus',
        difficulty: 'advanced' as const,
        createdAt: new Date().toISOString(),
        cards: [
          { front: 'What is a derivative?', back: 'The rate of change of a function' },
          { front: 'What is an integral?', back: 'The accumulation of a function over an interval' },
        ],
      };
      
      const id2 = await saveFlashcardSet(testSet2);
      log(`✅ Saved second set with ID: ${id2}`);

      // Test 4: List all flashcard sets
      log('\n=== Test 4: List all flashcard sets ===');
      const allSets = await listFlashcardSets();
      log(`✅ Found ${allSets.length} flashcard sets`);
      allSets.forEach((set, idx) => {
        log(`   ${idx + 1}. ${set.topic} (${set.cards.length} cards, ID: ${set.id})`);
      });
      setSets(allSets);

      // Test 5: List with pagination
      log('\n=== Test 5: List with pagination (limit 1) ===');
      const limitedSets = await listFlashcardSets({ limit: 1 });
      log(`✅ Retrieved ${limitedSets.length} set(s) with limit`);

      // Test 6: Delete a flashcard set
      log('\n=== Test 6: Delete flashcard set ===');
      if (id) {
        await deleteFlashcardSet(id);
        log(`✅ Deleted flashcard set ${id}`);
        
        // Verify deletion
        const remaining = await listFlashcardSets();
        log(`   Remaining sets: ${remaining.length}`);
        setSets(remaining);
      }

      log('\n✅ All tests completed successfully!');
    } catch (error) {
      log(`\n❌ Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Test error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-dust-grey p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-serif text-4xl font-bold text-charcoal mb-8">
          Flashcard Database Tests
        </h1>

        <div className="bg-cream rounded-2xl p-6 shadow-md mb-6">
          <button
            onClick={runTests}
            className="px-6 py-3 bg-gradient-to-r from-sage-green to-soft-pink text-white font-semibold rounded-lg hover:shadow-lg transition-all"
          >
            Run Tests
          </button>
        </div>

        {results.length > 0 && (
          <div className="bg-cream rounded-2xl p-6 shadow-md mb-6">
            <h2 className="font-serif text-2xl font-bold text-charcoal mb-4">Test Results</h2>
            <pre className="font-mono text-sm text-charcoal whitespace-pre-wrap bg-dust-grey p-4 rounded-lg overflow-auto max-h-[500px]">
              {results.join('\n')}
            </pre>
          </div>
        )}

        {sets.length > 0 && (
          <div className="bg-cream rounded-2xl p-6 shadow-md">
            <h2 className="font-serif text-2xl font-bold text-charcoal mb-4">
              Current Flashcard Sets ({sets.length})
            </h2>
            <div className="space-y-4">
              {sets.map((set) => (
                <div key={set.id} className="bg-dust-grey p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-lg text-charcoal">{set.topic}</h3>
                      <p className="text-sm text-dim-grey">
                        {set.subject} • {set.difficulty} • {set.cards.length} cards
                      </p>
                      {set.noteId && (
                        <p className="text-xs text-dim-grey">Note ID: {set.noteId}</p>
                      )}
                    </div>
                    <span className="text-xs text-dim-grey">ID: {set.id}</span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {set.cards.slice(0, 2).map((card, idx) => (
                      <div key={idx} className="text-xs text-charcoal">
                        <span className="font-medium">Q:</span> {card.front}
                      </div>
                    ))}
                    {set.cards.length > 2 && (
                      <p className="text-xs text-dim-grey italic">
                        ...and {set.cards.length - 2} more
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
