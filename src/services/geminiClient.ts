import type { AIParsingResponse } from '../types';

/**
 * Client-side integration service to request natural language expense extraction.
 *
 * CRITICAL SECURITY PRINCIPLE:
 * This client NEVER possesses or transmits a Gemini API key. All AI interaction is routed
 * through the server-side API endpoint (/api/gemini/parse-expense), where GEMINI_API_KEY
 * is strictly isolated in server environment variables.
 */
export async function extractExpenseWithAI(prompt: string): Promise<AIParsingResponse> {
  const trimmed = prompt ? prompt.trim() : '';

  if (!trimmed) {
    return {
      success: false,
      errorType: 'EMPTY_PROMPT',
      message: 'Please describe your expense before submitting.',
    };
  }

  try {
    const response = await fetch('/api/gemini/parse-expense', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt: trimmed }),
    });

    let jsonResponse: AIParsingResponse;
    try {
      jsonResponse = (await response.json()) as AIParsingResponse;
    } catch {
      return {
        success: false,
        errorType: 'MALFORMED_RESPONSE',
        message: 'The server returned an invalid response format.',
      };
    }

    return jsonResponse;
  } catch (error: unknown) {
    return {
      success: false,
      errorType: 'NETWORK_ERROR',
      message:
        error instanceof Error && error.message
          ? `Network error: ${error.message}. Is the server running?`
          : 'Could not connect to the expense parsing service. Please check your network.',
    };
  }
}
