export interface ClassificationResult {
  subject: string;
  topic: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
}

export function getClassifierPrompt(notes: string): string {
  return `Analyze the following notes and classify them. Return ONLY a valid JSON object with the following structure:
{
  "subject": "the main academic or professional subject (e.g., Mathematics, Biology, History, Programming, Business)",
  "topic": "the specific topic or subtopic covered (e.g., Calculus, Cell Biology, World War II, React Hooks, Marketing Strategy)",
  "difficulty": "beginner, intermediate, or advanced",
  "tags": ["relevant", "keywords", "and", "concepts"]
}

Rules:
1. The "subject" should be a broad category
2. The "topic" should be specific to what's covered in the notes
3. The "difficulty" must be exactly one of: beginner, intermediate, or advanced
4. The "tags" array should contain 3-7 relevant keywords or concepts from the notes
5. Return ONLY the JSON object, no additional text or explanation
6. Ensure the JSON is properly formatted and parseable

Notes to analyze:
${notes}

JSON Response:`;
}
