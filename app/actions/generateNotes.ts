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

const formatLabels: Record<string, string> = {
  "bullet-points": "bullet points",
  "paragraph": "a cohesive paragraph",
  "checklist": "a checklist",
  "summary": "a summary",
  "outline": "an outline"
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

    const type = formatLabels[format] || format;
    const prompt = `Transform the following input into {{type}}. Keep the formatting clean and well-organized. Return only the formatted output without any additional explanation.

Input: {{input}}

Format as: {{type}}`;

    const filledPrompt = prompt
      .replace(/\{\{type\}\}/g, type)
      .replace(/\{\{input\}\}/g, input);

    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'moonshotai/kimi-k2-instruct-0905',
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
