export interface FlashCard {
  front: string;
  back: string;
}

export function getFlashcardPrompt(text: string, numCards: number): string {
  return `Generate exactly ${numCards} flashcards from the following text. Return ONLY a valid JSON array of flashcard objects with the following structure:
[
  {
    "front": "question or prompt (clear, concise, one concept per card)",
    "back": "answer or explanation (accurate, complete, helpful)"
  }
]

Rules:
1. Generate exactly ${numCards} flashcards (no more, no less)
2. Each "front" should be a clear question or prompt that tests one specific concept
3. Each "back" should provide the answer or explanation
4. Keep fronts concise (ideally under 100 characters)
5. Keep backs focused but complete (aim for 1-3 sentences)
6. Prioritize the most important concepts from the text
7. Ensure variety - cover different aspects of the topic
8. Return ONLY the JSON array, no additional text or explanation
9. Ensure the JSON is properly formatted and parseable
10. Do not include markdown code blocks or formatting - just the raw JSON array

Safety and Quality Guidelines:
- Skip any content that is unclear, ambiguous, or lacks sufficient context
- Focus on factual, verifiable information from the source text
- If the text is too short for ${numCards} cards, generate as many quality cards as possible
- Avoid redundant or overlapping questions
- Use clear, accessible language appropriate for learning

Text to convert into flashcards:
${text.trim().slice(0, 8000)}

JSON Array Response:`;
}
