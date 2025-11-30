import { NextRequest, NextResponse } from "next/server";
import {
  getFlashcardPrompt,
  FlashCard,
} from "@/lib/prompts/flashcardPrompt";

// Helper function to validate a single flashcard
export function isValidFlashcard(obj: unknown): obj is FlashCard {
  if (!obj || typeof obj !== "object") return false;

  const card = obj as Record<string, unknown>;

  return (
    typeof card.front === "string" &&
    card.front.trim().length > 0 &&
    typeof card.back === "string" &&
    card.back.trim().length > 0
  );
}

// Helper function to validate array of flashcards
export function isValidFlashcardArray(obj: unknown): obj is FlashCard[] {
  if (!Array.isArray(obj)) return false;
  if (obj.length === 0) return false;

  return obj.every(isValidFlashcard);
}

// Helper function to normalize flashcard array
export function normalizeFlashcards(obj: unknown): FlashCard[] | null {
  if (!Array.isArray(obj)) return null;

  try {
    const normalized: FlashCard[] = obj
      .filter((item) => item && typeof item === "object")
      .map((item) => {
        const card = item as Record<string, unknown>;
        return {
          front:
            typeof card.front === "string" ? card.front.trim() : "Question",
          back: typeof card.back === "string" ? card.back.trim() : "Answer",
        };
      })
      .filter((card) => card.front.length > 0 && card.back.length > 0);

    // Return null if no valid cards
    if (normalized.length === 0) return null;

    return normalized;
  } catch (error) {
    console.error("Error normalizing flashcards:", error);
    return null;
  }
}

// Helper function to parse JSON from Groq response (handles markdown code blocks)
export function parseGroqJsonResponse(content: string): unknown {
  try {
    // First, try direct JSON parse
    return JSON.parse(content);
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = content.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch {
        // Continue to next attempt
      }
    }

    // Try to find a JSON array in the content
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch {
        // Continue to next attempt
      }
    }

    throw new Error("Could not parse JSON from response");
  }
}

// Groq-based flashcard generation
async function generateFlashcardsWithGroq(
  text: string,
  numCards: number,
  apiKey: string
): Promise<FlashCard[]> {
  const prompt = getFlashcardPrompt(text, numCards);

  const response = await fetch(
    "https://api.groq.com/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2-instruct-0905",
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Groq API error (status hidden for security):", {
      status: response.status,
      statusText: response.statusText,
    });
    throw new Error(
      `Groq API request failed: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    console.error("Unexpected Groq API response structure");
    throw new Error("Unexpected response from Groq API");
  }

  const content = data.choices[0].message.content.trim();

  // Parse JSON defensively
  const parsed = parseGroqJsonResponse(content);
  const normalized = normalizeFlashcards(parsed);

  if (!normalized) {
    console.error("Failed to normalize Groq flashcard result");
    throw new Error("Invalid flashcard result from Groq API");
  }

  return normalized;
}

// Xenova Transformers fallback flashcard generation
async function generateFlashcardsWithXenova(
  text: string,
  numCards: number
): Promise<FlashCard[]> {
  try {
    const { pipeline } = await import("@xenova/transformers");

    // Use feature extraction to find key sentences
    const extractor = await pipeline(
      "feature-extraction",
      "Xenova/all-MiniLM-L6-v2"
    );

    // Split text into sentences
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 300);

    if (sentences.length === 0) {
      throw new Error("Text is too short or contains no valid sentences");
    }

    // For fallback, we'll create simple Q&A pairs from key sentences
    // Strategy: Take important sentences and format them as flashcards
    const cards: FlashCard[] = [];

    // Take up to numCards sentences, prioritizing longer/more detailed ones
    const sortedSentences = sentences
      .sort((a, b) => b.length - a.length)
      .slice(0, Math.min(numCards * 2, sentences.length));

    for (let i = 0; i < Math.min(numCards, sortedSentences.length); i++) {
      const sentence = sortedSentences[i];

      // Extract potential topic/subject from sentence
      const words = sentence.split(/\s+/);
      
      // Create a question from the sentence
      let front: string;
      let back: string;

      // Try to identify key phrases (capitalize words that might be important)
      const keyWordMatch = sentence.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
      
      if (keyWordMatch && keyWordMatch[1]) {
        // If we found a capitalized term, ask about it
        front = `What is ${keyWordMatch[1]}?`;
        back = sentence;
      } else if (words.length > 10) {
        // For longer sentences, use first half as context for question
        const midPoint = Math.floor(words.length / 2);
        const firstHalf = words.slice(0, midPoint).join(" ");
        front = `What can you tell me about: ${firstHalf.slice(0, 80)}...?`;
        back = sentence;
      } else {
        // For shorter sentences, ask for explanation
        front = `Explain this concept`;
        back = sentence;
      }

      cards.push({
        front: front.trim(),
        back: back.trim(),
      });
    }

    // Ensure we generated at least one card
    if (cards.length === 0) {
      // Fallback: create a single card from the entire text
      cards.push({
        front: "What is the main concept from this text?",
        back: text.slice(0, 500).trim(),
      });
    }

    return cards;
  } catch (error) {
    console.error("Xenova flashcard generation error:", error);
    throw new Error(
      "Failed to generate flashcards with local model: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
  }
}

// Main POST handler
export async function POST(request: NextRequest) {
  try {
    // Validate content type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "Content-Type must be application/json",
        },
        { status: 400 }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON in request body",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        {
          success: false,
          error: "Request body must be a JSON object",
        },
        { status: 400 }
      );
    }

    const { text, numCards } = body as Record<string, unknown>;

    // Validate text field
    if (typeof text !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'text' is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (text.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'text' cannot be empty",
        },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'text' must be less than 10,000 characters",
        },
        { status: 400 }
      );
    }

    // Validate and normalize numCards
    let validatedNumCards = 10; // default
    if (numCards !== undefined) {
      if (typeof numCards !== "number" || !Number.isInteger(numCards)) {
        return NextResponse.json(
          {
            success: false,
            error: "Field 'numCards' must be an integer",
          },
          { status: 400 }
        );
      }

      if (numCards < 1) {
        return NextResponse.json(
          {
            success: false,
            error: "Field 'numCards' must be at least 1",
          },
          { status: 400 }
        );
      }

      // Cap at 20
      validatedNumCards = Math.min(numCards, 20);
    }

    // Decide provider based on GROQ_API_KEY
    const apiKey = process.env.GROQ_API_KEY;
    let cards: FlashCard[];

    try {
      if (apiKey && apiKey.trim().length > 0) {
        // Use Groq
        console.log("Generating flashcards with Groq API");
        cards = await generateFlashcardsWithGroq(text, validatedNumCards, apiKey);
      } else {
        // Fallback to Xenova
        console.log("Generating flashcards with Xenova Transformers (local)");
        cards = await generateFlashcardsWithXenova(text, validatedNumCards);
      }

      return NextResponse.json({
        success: true,
        cards,
      });
    } catch (error) {
      console.error("Flashcard generation provider error:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to generate flashcards. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in generateFlashcards API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}

// Reject non-POST requests
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST.",
    },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST.",
    },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST.",
    },
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    {
      success: false,
      error: "Method not allowed. Use POST.",
    },
    { status: 405 }
  );
}

/*
 * TESTING NOTES (curl/Postman)
 * 
 * Basic test (with default 10 cards):
 * curl -X POST http://localhost:3000/api/generateFlashcards \
 *   -H "Content-Type: application/json" \
 *   -d '{"text": "Photosynthesis is the process by which plants convert sunlight into energy. It occurs in chloroplasts and requires carbon dioxide, water, and light. The products are glucose and oxygen."}'
 * 
 * Custom number of cards:
 * curl -X POST http://localhost:3000/api/generateFlashcards \
 *   -H "Content-Type: application/json" \
 *   -d '{"text": "The mitochondria is the powerhouse of the cell...", "numCards": 5}'
 * 
 * Test validation errors:
 * - Empty text: {"text": ""}
 * - Missing text: {"numCards": 10}
 * - Invalid numCards: {"text": "...", "numCards": -1}
 * - Text too long: {"text": "<10001 characters>"}
 * 
 * Test method rejection:
 * curl -X GET http://localhost:3000/api/generateFlashcards
 * 
 * Expected success response:
 * {
 *   "success": true,
 *   "cards": [
 *     {"front": "What is photosynthesis?", "back": "The process by which plants convert sunlight into energy"},
 *     ...
 *   ]
 * }
 * 
 * Expected error response:
 * {
 *   "success": false,
 *   "error": "Field 'text' cannot be empty"
 * }
 */
