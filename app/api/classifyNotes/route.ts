import { NextRequest, NextResponse } from "next/server";
import {
  getClassifierPrompt,
  ClassificationResult,
} from "@/lib/prompts/classifierPrompt";

// Helper function to validate classification result
export function isValidClassification(
  obj: unknown
): obj is ClassificationResult {
  if (!obj || typeof obj !== "object") return false;

  const result = obj as Record<string, unknown>;

  return (
    typeof result.subject === "string" &&
    result.subject.trim().length > 0 &&
    typeof result.topic === "string" &&
    result.topic.trim().length > 0 &&
    (result.difficulty === "beginner" ||
      result.difficulty === "intermediate" ||
      result.difficulty === "advanced") &&
    Array.isArray(result.tags) &&
    result.tags.length > 0 &&
    result.tags.every((tag) => typeof tag === "string" && tag.trim().length > 0)
  );
}

// Helper function to normalize classification result
export function normalizeClassification(
  obj: unknown
): ClassificationResult | null {
  if (!obj || typeof obj !== "object") return null;

  const result = obj as Record<string, unknown>;

  try {
    const normalized: ClassificationResult = {
      subject:
        typeof result.subject === "string" ? result.subject.trim() : "General",
      topic:
        typeof result.topic === "string" ? result.topic.trim() : "Uncategorized",
      difficulty:
        result.difficulty === "beginner" ||
        result.difficulty === "intermediate" ||
        result.difficulty === "advanced"
          ? result.difficulty
          : "intermediate",
      tags: Array.isArray(result.tags)
        ? result.tags
            .filter((tag) => typeof tag === "string" && tag.trim().length > 0)
            .map((tag) => (tag as string).trim())
        : ["general"],
    };

    // Ensure at least one tag
    if (normalized.tags.length === 0) {
      normalized.tags = ["general"];
    }

    // Limit to 10 tags
    if (normalized.tags.length > 10) {
      normalized.tags = normalized.tags.slice(0, 10);
    }

    return normalized;
  } catch (error) {
    console.error("Error normalizing classification:", error);
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
    const jsonBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonBlockMatch && jsonBlockMatch[1]) {
      try {
        return JSON.parse(jsonBlockMatch[1]);
      } catch {
        // Continue to next attempt
      }
    }

    // Try to find a JSON object in the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
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

// Groq-based classification
async function classifyWithGroq(
  notes: string,
  apiKey: string
): Promise<ClassificationResult> {
  const prompt = getClassifierPrompt(notes);

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
        temperature: 0.3,
        max_tokens: 500,
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
  const normalized = normalizeClassification(parsed);

  if (!normalized) {
    console.error("Failed to normalize Groq classification result");
    throw new Error("Invalid classification result from Groq API");
  }

  return normalized;
}

// Xenova Transformers fallback classification
async function classifyWithXenova(
  notes: string
): Promise<ClassificationResult> {
  try {
    const { pipeline } = await import("@xenova/transformers");

    // Use zero-shot classification for subject and difficulty
    const classifier = await pipeline(
      "zero-shot-classification",
      "Xenova/mobilebert-uncased-mnli"
    );

    // Classify subject
    const subjectCandidates = [
      "Mathematics",
      "Science",
      "History",
      "Programming",
      "Business",
      "Language",
      "Arts",
      "Engineering",
      "Medicine",
      "General",
    ];

    const subjectResult = await classifier(notes.slice(0, 500), subjectCandidates, {
      multi_label: false,
    });

    // Classify difficulty
    const difficultyCandidates = ["beginner", "intermediate", "advanced"];
    const difficultyResult = await classifier(
      notes.slice(0, 500),
      difficultyCandidates,
      { multi_label: false }
    );

    // Extract labels from results (handle both single and array results)
    const subjectLabels = Array.isArray(subjectResult)
      ? subjectResult[0]?.labels
      : (subjectResult as { labels: string[] }).labels;
    const difficultyLabels = Array.isArray(difficultyResult)
      ? difficultyResult[0]?.labels
      : (difficultyResult as { labels: string[] }).labels;

    // Extract topic from first sentence or heading
    const lines = notes.split("\n").filter((line) => line.trim().length > 0);
    const firstLine = lines[0] || "";
    const topic =
      firstLine.length > 100
        ? firstLine.slice(0, 100).trim() + "..."
        : firstLine.trim() || "General Topic";

    // Extract key phrases (simple approach: get most common words)
    const words = notes
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3);

    const wordFreq = new Map<string, number>();
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }

    // Common stop words to filter out
    const stopWords = new Set([
      "this",
      "that",
      "with",
      "from",
      "have",
      "been",
      "were",
      "their",
      "there",
      "would",
      "could",
      "should",
      "about",
      "which",
      "these",
      "those",
      "then",
      "than",
      "them",
      "when",
      "where",
      "what",
      "does",
      "done",
    ]);

    const tags = Array.from(wordFreq.entries())
      .filter(([word]) => !stopWords.has(word))
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([word]) => word);

    return {
      subject: subjectLabels?.[0] || "General",
      topic,
      difficulty: (difficultyLabels?.[0] as
        | "beginner"
        | "intermediate"
        | "advanced") || "intermediate",
      tags: tags.length > 0 ? tags : ["general"],
    };
  } catch (error) {
    console.error("Xenova classification error:", error);
    throw new Error(
      "Failed to classify notes with local model: " +
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

    const { notes } = body as Record<string, unknown>;

    if (typeof notes !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'notes' is required and must be a string",
        },
        { status: 400 }
      );
    }

    if (notes.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'notes' cannot be empty",
        },
        { status: 400 }
      );
    }

    if (notes.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          error: "Field 'notes' must be less than 10,000 characters",
        },
        { status: 400 }
      );
    }

    // Decide provider based on GROQ_API_KEY
    const apiKey = process.env.GROQ_API_KEY;
    let classification: ClassificationResult;

    try {
      if (apiKey && apiKey.trim().length > 0) {
        // Use Groq
        console.log("Classifying with Groq API");
        classification = await classifyWithGroq(notes, apiKey);
      } else {
        // Fallback to Xenova
        console.log("Classifying with Xenova Transformers (local)");
        classification = await classifyWithXenova(notes);
      }

      return NextResponse.json({
        success: true,
        classification,
      });
    } catch (error) {
      console.error("Classification provider error:", error);
      return NextResponse.json(
        {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Failed to classify notes. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in classify API:", error);
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
