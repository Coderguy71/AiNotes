# Flashcard Components Documentation

## Overview

Two new reusable components for displaying and navigating flashcards:

1. **`Flashcard.tsx`** - A single flippable flashcard with 3D animation
2. **`FlashcardCarousel.tsx`** - A carousel for navigating multiple flashcards

Both components follow the established brand identity and design patterns of EasyNotesAI.

---

## Component: Flashcard

### Description
A single flippable flashcard with smooth 3D flip animation powered by Framer Motion.

### Features
- ✅ Click/tap to flip between front and back
- ✅ Keyboard support: Space or Enter to flip
- ✅ Smooth 3D flip animation with perspective
- ✅ Respects `prefers-reduced-motion` for accessibility
- ✅ Subtle hover state with scale and shadow effects
- ✅ SSR-safe with Framer Motion guards

### Styling
- **Front face**: Almond-silk background (#ccb7ae)
- **Back face**: Dusty-mauve background (#a6808c)
- **Text**: Charcoal (#565264) on front, Cream on back
- **Border radius**: 16px (--radius-default)
- **Shadows**: Soft elevation with hover enhancement

### Props

```typescript
interface FlashcardProps {
  front: string;              // Text to display on front (question/prompt)
  back: string;               // Text to display on back (answer/explanation)
  className?: string;         // Optional additional CSS classes
  frontClassName?: string;    // Optional CSS classes for front face
  backClassName?: string;     // Optional CSS classes for back face
  onFlip?: (isFlipped: boolean) => void; // Callback when card flips
}
```

### Basic Usage

```tsx
import Flashcard from "@/components/Flashcard";

export default function MyPage() {
  return (
    <Flashcard 
      front="What is React?" 
      back="A JavaScript library for building user interfaces"
    />
  );
}
```

### Custom Colors

```tsx
<Flashcard 
  front="Question" 
  back="Answer"
  frontClassName="bg-sage-green text-cream"
  backClassName="bg-terracotta text-cream"
/>
```

### With Callback

```tsx
<Flashcard 
  front="What is JSX?" 
  back="JavaScript XML - a syntax extension"
  onFlip={(flipped) => console.log('Card flipped:', flipped)}
/>
```

---

## Component: FlashcardCarousel

### Description
A responsive carousel for navigating through multiple flashcards with animations, keyboard shortcuts, and progress tracking.

### Features
- ✅ Prev/Next navigation with disabled states at boundaries
- ✅ Keyboard shortcuts: Arrow Left/Right for navigation
- ✅ Animated card transitions (slide + fade with spring physics)
- ✅ Visual progress bar with percentage
- ✅ "Card X of Y" accessibility label
- ✅ Auto-reset flip state when navigating (configurable)
- ✅ Loading state with skeleton UI
- ✅ Empty state with custom messaging
- ✅ Fully responsive (full width mobile, constrained desktop)

### Keyboard Shortcuts
- `←` Left Arrow: Previous card
- `→` Right Arrow: Next card
- `Space` or `Enter`: Flip current card (handled by Flashcard component)

### Props

```typescript
interface FlashcardData {
  front: string;
  back: string;
}

interface FlashcardCarouselProps {
  cards: FlashcardData[];                    // Array of flashcard data
  onCardChange?: (index: number) => void;    // Callback when navigating
  onComplete?: () => void;                   // Callback when reaching last card
  isLoading?: boolean;                       // Show loading skeleton
  emptyMessage?: string;                     // Custom empty state message
  showProgress?: boolean;                    // Show/hide progress bar (default: true)
  autoFlipOnNav?: boolean;                   // Auto-flip to front on nav (default: true)
  className?: string;                        // Optional additional CSS classes
}
```

### Basic Usage

```tsx
import FlashcardCarousel from "@/components/FlashcardCarousel";

const flashcards = [
  { front: "What is React?", back: "A JavaScript library for building UIs" },
  { front: "What is JSX?", back: "JavaScript XML syntax extension" },
  { front: "What are Hooks?", back: "Functions for using state in functional components" },
];

export default function StudyPage() {
  return (
    <FlashcardCarousel
      cards={flashcards}
      onCardChange={(index) => console.log('Viewing card:', index)}
      onComplete={() => alert('Great job! You completed all cards!')}
    />
  );
}
```

### Loading State

```tsx
<FlashcardCarousel 
  cards={[]} 
  isLoading={true} 
/>
```

### Empty State

```tsx
<FlashcardCarousel 
  cards={[]} 
  emptyMessage="No flashcards found. Generate some from your notes!" 
/>
```

### Without Progress Bar

```tsx
<FlashcardCarousel 
  cards={flashcards}
  showProgress={false}
  autoFlipOnNav={false}
/>
```

---

## Integration with Database

### Loading Flashcards from Database

```tsx
"use client";

import { useState, useEffect } from "react";
import FlashcardCarousel from "@/components/FlashcardCarousel";
import { getFlashcardSet } from "@/lib/db";

export default function FlashcardStudyPage({ params }: { params: { id: string } }) {
  const [flashcardSet, setFlashcardSet] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadFlashcards() {
      try {
        const set = await getFlashcardSet(Number(params.id));
        setFlashcardSet(set);
      } catch (error) {
        console.error("Failed to load flashcards:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadFlashcards();
  }, [params.id]);

  if (isLoading) {
    return <FlashcardCarousel cards={[]} isLoading={true} />;
  }

  if (!flashcardSet) {
    return (
      <FlashcardCarousel 
        cards={[]} 
        emptyMessage="Flashcard set not found" 
      />
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-serif font-bold text-charcoal mb-2">
            {flashcardSet.subject}: {flashcardSet.topic}
          </h1>
          <span className={`inline-block px-3 py-1 rounded-[--radius-sm] text-sm font-medium ${
            flashcardSet.difficulty === 'beginner' ? 'bg-sage-green/20 text-sage-green' :
            flashcardSet.difficulty === 'intermediate' ? 'bg-dusty-mauve/20 text-dusty-mauve' :
            'bg-terracotta/20 text-terracotta'
          }`}>
            {flashcardSet.difficulty}
          </span>
        </div>

        <FlashcardCarousel
          cards={flashcardSet.cards}
          onComplete={() => alert('Study session complete! Great work!')}
        />
      </div>
    </div>
  );
}
```

### Listing All Flashcard Sets

```tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { listFlashcardSets, type FlashcardSet } from "@/lib/db";

export default function FlashcardLibrary() {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSets() {
      try {
        const allSets = await listFlashcardSets({ limit: 20 });
        setSets(allSets);
      } catch (error) {
        console.error("Failed to load flashcard sets:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadSets();
  }, []);

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-serif font-bold text-center mb-8">
          Your Flashcard Sets
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/flashcards/${set.id}`}
              className="block rounded-[--radius-lg] bg-cream p-6 shadow-[--shadow-md] hover-lift"
            >
              <h3 className="font-serif text-xl font-semibold text-charcoal mb-2">
                {set.subject}
              </h3>
              <p className="text-charcoal/70 mb-4">{set.topic}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-charcoal/60">
                  {set.cards.length} cards
                </span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  set.difficulty === 'beginner' ? 'bg-sage-green/20 text-sage-green' :
                  set.difficulty === 'intermediate' ? 'bg-dusty-mauve/20 text-dusty-mauve' :
                  'bg-terracotta/20 text-terracotta'
                }`}>
                  {set.difficulty}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Responsive Design

### Mobile (<640px)
- Full width layout
- Stacked navigation buttons
- Minimum 280px card height
- Touch-optimized with 48px minimum touch targets

### Desktop (≥640px)
- Constrained width (max 800px, centered)
- Horizontal navigation buttons
- Minimum 320px card height
- Hover effects and tooltips

---

## Accessibility

- ✅ Keyboard navigable (Space/Enter to flip, Arrow keys to navigate)
- ✅ ARIA labels for screen readers
- ✅ Focus rings for keyboard users
- ✅ Reduced motion support (`prefers-reduced-motion`)
- ✅ Live region announcements for progress
- ✅ Semantic HTML structure

---

## Customization

### Colors

Both components use the brand color palette by default, but can be customized:

**Default Colors:**
- Almond Silk: `#ccb7ae`
- Dusty Mauve: `#a6808c`
- Charcoal: `#565264`
- Cream: `#faf8f5`
- Sage Green: `#a8b5a0`
- Terracotta: `#d97d62`

**Custom Flashcard Colors:**
```tsx
<Flashcard 
  front="Question"
  back="Answer"
  frontClassName="bg-sage-green text-cream"
  backClassName="bg-terracotta text-cream"
/>
```

### Animations

All animations use the existing motion tokens:
- Duration: 200-600ms
- Easing: `ease-out`, `cubic-bezier(0.4, 0.0, 0.2, 1)`
- Spring physics for carousel transitions
- Respects `prefers-reduced-motion`

---

## Best Practices

1. **Keep text concise**: Front and back text should be brief for best readability
2. **Loading states**: Always provide loading state when fetching data
3. **Empty states**: Provide helpful empty state messages
4. **Completion callback**: Use `onComplete` to provide feedback when users finish
5. **Progress tracking**: Keep progress bar enabled for longer study sessions
6. **Keyboard hints**: The carousel displays keyboard shortcuts automatically

---

## Examples

### Simple Quiz
```tsx
const quizCards = [
  { front: "2 + 2 = ?", back: "4" },
  { front: "Capital of France?", back: "Paris" },
  { front: "Largest planet?", back: "Jupiter" },
];

<FlashcardCarousel cards={quizCards} />
```

### Vocabulary Study
```tsx
const vocabCards = [
  { front: "Ephemeral", back: "Lasting for a very short time" },
  { front: "Ubiquitous", back: "Present, appearing, or found everywhere" },
  { front: "Serendipity", back: "The occurrence of events by chance in a happy way" },
];

<FlashcardCarousel 
  cards={vocabCards}
  onComplete={() => console.log('Vocabulary review complete!')}
/>
```

### Code Snippets
```tsx
const codeCards = [
  { 
    front: "useState Hook", 
    back: "const [state, setState] = useState(initialValue)" 
  },
  { 
    front: "useEffect Hook", 
    back: "useEffect(() => { /* effect */ }, [dependencies])" 
  },
];

<FlashcardCarousel cards={codeCards} showProgress={true} />
```

---

## Testing

Both components have been tested for:
- ✅ SSR compatibility (no hydration errors)
- ✅ Build process (TypeScript compilation)
- ✅ Runtime behavior (flip animations, navigation)
- ✅ Responsive design (mobile and desktop)
- ✅ Accessibility (keyboard navigation, screen readers)
- ✅ Reduced motion preferences

---

## Future Enhancements

Potential improvements for future iterations:
- Shuffle mode for random card order
- Mark cards as "mastered" or "need review"
- Spaced repetition algorithm integration
- Export/share flashcard sets
- Print mode for physical study cards
- Multi-language support
- Audio pronunciation for vocabulary cards
- Image support on cards

---

## Support

For questions or issues with these components, please refer to:
- Component source code: `/components/Flashcard.tsx` and `/components/FlashcardCarousel.tsx`
- Database module: `/lib/db.ts` for flashcard data operations
- Brand identity: See main project README for color palette and design tokens
