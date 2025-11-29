"use server";

interface GenerateNotesInput {
  input: string;
  format: string;
}

interface GenerateNotesResponse {
  success: boolean;
  output?: string;
  error?: string;
}

const formatPrompts: Record<string, string> = {
  "bullet-points": `Transform the following text into clear, concise bullet points. Each bullet should be a key idea or concept. Use sub-bullets for details. Return ONLY the formatted bullet points.

Input: {{input}}`,

  "paragraph": `Transform the following input into a cohesive, well-organized paragraph. Use clear language and logical flow. Return ONLY the formatted paragraph without extra explanation.

Input: {{input}}`,

  "checklist": `Transform the following input into a practical checklist. Make items actionable and clear. Use checkboxes format. Return ONLY the formatted checklist.

Input: {{input}}`,

  "summary": `Create a concise summary of the following text in 3-5 sentences. Capture the main ideas and key points. Return ONLY the summary without introduction.

Input: {{input}}`,

  "outline": `Create a detailed outline from the following text. Use clear hierarchical structure with main points and sub-points. Return ONLY the formatted outline.

Input: {{input}}`
};

export async function generateNotes({
  input,
  format,
}: GenerateNotesInput): Promise<GenerateNotesResponse> {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      console.error("GROQ_API_KEY is not configured");
      return {
        success: false,
        error: "API key is not configured. Please check your environment variables.",
      };
    }

    const prompt = formatPrompts[format] || formatPrompts["summary"];

    const filledPrompt = prompt.replace(/\{\{input\}\}/g, input);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'llama-3.1-70b-versatile',
          messages: [
            {
              role: "user",
              content: filledPrompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Groq API error:", errorData);
      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
      };
    }

    const data = await response.json();

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error("Unexpected API response structure:", data);
      return {
        success: false,
        error: "Unexpected response from the API. Please try again.",
      };
    }

    const output = data.choices[0].message.content.trim();

    return {
      success: true,
      output,
    };
  } catch (error) {
    console.error("Error generating notes:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred. Please try again.",
    };
  }
}
