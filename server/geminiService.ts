import { GoogleGenAI, Type, type Schema } from '@google/genai';
import type {
  AIExtractedExpense,
  AIParsingResponse,
  ExpenseTargetType,
  WorkCostCategory,
  EssentialBillCategory,
} from '../src/types/index.ts';

export const VALID_WORK_CATEGORIES: WorkCostCategory[] = [
  'FUEL',
  'MOBILE_DATA',
  'VEHICLE_REPAIR',
  'OTHER_WORK',
];

export const VALID_BILL_CATEGORIES: EssentialBillCategory[] = [
  'RENT',
  'VEHICLE_EMI',
  'RATION',
  'UTILITY',
  'OTHER_BILL',
];

/**
 * Verified compatible model hierarchy:
 * 1. gemini-3.8-flash: Primary model for advanced reasoning and parsing
 * 2. gemini-3.5-flash: Verified active fallback when 3.8 is unavailable/overloaded
 * 3. gemini-3.5-flash-lite: Verified fast, lightweight fallback
 */
export const GEMINI_MODEL_HIERARCHY = [
  'gemini-3.8-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
] as const;

export interface GeminiParsingOptions {
  models?: readonly string[];
  maxRetriesPerModel?: number;
  initialDelayMs?: number;
  timeoutMs?: number;
  aiClient?: GoogleGenAI;
}

const SETUP_INSTRUCTIONS = `To enable Gemini AI expense parsing, set the GEMINI_API_KEY environment variable:
1. Windows PowerShell:
   $env:GEMINI_API_KEY="your_actual_gemini_api_key_here"
2. Linux / macOS:
   export GEMINI_API_KEY="your_actual_gemini_api_key_here"
3. Or add a .env file in the project root:
   GEMINI_API_KEY=your_actual_gemini_api_key_here
4. Restart the development or preview server (npm run dev).`;

const SYSTEM_INSTRUCTION = `You are an expert expense parser for KaamBuffer, a financial cash-flow tool for Indian gig workers (delivery partners for Swiggy, Zomato, Zepto, Blinkit, and drivers for Uber, Ola).

Your job is to extract structured expense information from user sentences in English, Hindi, or Hinglish.

Extract the following JSON fields:
- targetType: "WORK_COST" (for running shift costs) or "ESSENTIAL_BILL" (for household, loan, or life bills).
- category:
  For WORK_COST:
    * "FUEL": Petrol, CNG, EV battery swap, diesel
    * "MOBILE_DATA": Mobile recharge, data pack, internet for delivery app
    * "VEHICLE_REPAIR": Puncture repair, servicing, engine oil, chain, tyre, brake shoe
    * "OTHER_WORK": Delivery bag deposit, platform uniform, parking, toll, challan
  For ESSENTIAL_BILL:
    * "RENT": Room rent, house rent, PG accommodation
    * "VEHICLE_EMI": Bike loan EMI, scooter EMI, vehicle rent/lease, auto installment
    * "RATION": Groceries, aata, daal, rice, vegetables, milk, cooking essentials
    * "UTILITY": Electricity (bijli) bill, LPG gas cylinder, water bill
    * "OTHER_BILL": Medicines, doctor/clinic fees, school fees, emergency loan repayment

- amount: The numeric value in Indian Rupees (₹). If not specified or unknown, return null.
- title: A concise, human-readable title (e.g., "Petrol for delivery", "Aata & Doodh", "Room Rent").
- dueWithinHours: Number of hours until payment is due. For bills, default to 24 if unspecified. If "urgent"/"today", use 12. If "tomorrow", use 24. If "in 2 days", use 48.
- date: Mention of timing such as "today", "tomorrow", or ISO date string if identifiable.
- notes: Any additional context provided by user.
- confidence: Float from 0.0 to 1.0 indicating extraction confidence.`;

const EXPENSE_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    targetType: {
      type: Type.STRING,
      enum: ['WORK_COST', 'ESSENTIAL_BILL'],
      description: 'Whether this is a work running expense or an essential upcoming bill',
    },
    category: {
      type: Type.STRING,
      enum: [
        'FUEL',
        'MOBILE_DATA',
        'VEHICLE_REPAIR',
        'OTHER_WORK',
        'RENT',
        'VEHICLE_EMI',
        'RATION',
        'UTILITY',
        'OTHER_BILL',
      ],
      description: 'The matching KaamBuffer expense category',
    },
    title: {
      type: Type.STRING,
      description: 'Clean, concise title for the expense item',
    },
    amount: {
      type: Type.NUMBER,
      description: 'Amount in Indian Rupees (₹), or null if not mentioned by user',
    },
    dueWithinHours: {
      type: Type.INTEGER,
      description: 'Hours until due (for essential bills, default 24)',
    },
    date: {
      type: Type.STRING,
      description: 'Interpreted date or relative time reference (e.g. today, tomorrow)',
    },
    notes: {
      type: Type.STRING,
      description: 'Optional additional context or note',
    },
    confidence: {
      type: Type.NUMBER,
      description: 'Extraction confidence score between 0.0 and 1.0',
    },
  },
  required: ['targetType', 'category', 'title'],
};

/**
 * Validates, normalizes, and sanitizes raw JSON parsed from Gemini output.
 * Never executes code or trusts raw AI output blindly.
 */
export function sanitizeAIExtraction(
  raw: Record<string, unknown>,
  originalPrompt: string
): AIExtractedExpense {
  // 1. Determine Target Type
  let targetType: ExpenseTargetType =
    raw.targetType === 'ESSENTIAL_BILL' ? 'ESSENTIAL_BILL' : 'WORK_COST';

  // 2. Determine and Normalize Category
  let categoryStr = typeof raw.category === 'string' ? raw.category.toUpperCase().trim() : '';

  // If category belongs to essential bills, adjust targetType
  if (VALID_BILL_CATEGORIES.includes(categoryStr as EssentialBillCategory)) {
    targetType = 'ESSENTIAL_BILL';
  } else if (VALID_WORK_CATEGORIES.includes(categoryStr as WorkCostCategory)) {
    targetType = 'WORK_COST';
  } else {
    categoryStr = targetType === 'ESSENTIAL_BILL' ? 'OTHER_BILL' : 'OTHER_WORK';
  }

  // 3. Amount Sanitation
  let amount: number | null = null;
  if (typeof raw.amount === 'number' && Number.isFinite(raw.amount) && raw.amount > 0) {
    amount = Math.round(raw.amount * 100) / 100;
  } else if (typeof raw.amount === 'string') {
    const parsed = parseFloat(raw.amount.replace(/[^0-9.]/g, ''));
    if (Number.isFinite(parsed) && parsed > 0) {
      amount = Math.round(parsed * 100) / 100;
    }
  }

  // 4. Title Sanitation
  let title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title) {
    title = categoryStr;
  }
  if (title.length > 80) {
    title = title.substring(0, 80);
  }

  // 5. Due Within Hours Sanitation
  let dueWithinHours = 24;
  if (typeof raw.dueWithinHours === 'number' && Number.isFinite(raw.dueWithinHours) && raw.dueWithinHours > 0) {
    dueWithinHours = Math.max(1, Math.min(720, Math.round(raw.dueWithinHours)));
  }

  // 6. Optional fields
  const date = typeof raw.date === 'string' && raw.date.trim() ? raw.date.trim() : undefined;
  const notes = typeof raw.notes === 'string' && raw.notes.trim() ? raw.notes.trim() : undefined;
  const confidence =
    typeof raw.confidence === 'number' && Number.isFinite(raw.confidence)
      ? Math.max(0, Math.min(1, raw.confidence))
      : 0.9;

  return {
    targetType,
    category: categoryStr as WorkCostCategory | EssentialBillCategory,
    title,
    amount,
    dueWithinHours,
    date,
    notes,
    rawPrompt: originalPrompt,
    confidence,
  };
}

/**
 * Checks whether an error from the Gemini API is transient and eligible for retry/fallback.
 */
export function isTransientGeminiError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes('503') ||
    lower.includes('unavailable') ||
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('busy') ||
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('timeout') ||
    lower.includes('aborted') ||
    lower.includes('econnreset') ||
    lower.includes('fetch failed')
  );
}

/**
 * Checks whether an error is an authentication / invalid key error.
 */
export function isAuthError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  return (
    lower.includes('api_key_invalid') ||
    lower.includes('invalid api key') ||
    lower.includes('api_key_not_found') ||
    lower.includes('401') ||
    lower.includes('403') ||
    lower.includes('permission_denied')
  );
}

/**
 * Promise-based delay helper
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Server-side function that processes a natural-language expense description using Gemini AI
 * with multi-model fallback and exponential backoff retry for transient errors (HTTP 503, 429).
 *
 * Never logs or exposes the API key.
 */
export async function parseExpenseWithGemini(
  prompt: string,
  explicitApiKey?: string,
  options?: GeminiParsingOptions
): Promise<AIParsingResponse> {
  const trimmed = prompt ? prompt.trim() : '';
  if (!trimmed) {
    return {
      success: false,
      errorType: 'EMPTY_PROMPT',
      message: 'Please enter an expense description before submitting.',
    };
  }

  const apiKey = explicitApiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      errorType: 'API_KEY_MISSING',
      message: 'Gemini API key is not configured on the server.',
      setupInstructions: SETUP_INSTRUCTIONS,
    };
  }

  const ai = options?.aiClient || new GoogleGenAI({ apiKey });
  const models = options?.models || GEMINI_MODEL_HIERARCHY;
  const maxRetriesPerModel = options?.maxRetriesPerModel ?? 2; // Initial try + 1 retry
  const initialDelayMs = options?.initialDelayMs ?? 300;
  const timeoutMs = options?.timeoutMs ?? 7000; // 7 second per-attempt timeout to failover quickly

  let hadRateLimit = false;
  let hadUnavailable = false;

  // Cascade across configured models in priority order
  for (const model of models) {
    for (let attempt = 0; attempt < maxRetriesPerModel; attempt++) {
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const timeoutPromise = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            reject(new Error(`Timeout of ${timeoutMs}ms exceeded while contacting Gemini API for model ${model}`));
          }, timeoutMs);
          if (typeof timer.unref === 'function') timer.unref();
        });

        const generatePromise = ai.models.generateContent({
          model,
          contents: `Expense description from gig worker: "${trimmed}"`,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: EXPENSE_RESPONSE_SCHEMA,
            temperature: 0.1,
          },
        });

        const response = await Promise.race([generatePromise, timeoutPromise]);
        clearTimeout(timer);

        const responseText = response.text?.trim();
        if (!responseText) {
          return {
            success: false,
            errorType: 'MALFORMED_RESPONSE',
            message: 'The AI model returned an empty response. Please try rephrasing your expense.',
          };
        }

        let parsedJson: Record<string, unknown>;
        try {
          parsedJson = JSON.parse(responseText);
        } catch {
          return {
            success: false,
            errorType: 'MALFORMED_RESPONSE',
            message: 'Failed to parse structured expense JSON from AI output.',
          };
        }

        const sanitizedData = sanitizeAIExtraction(parsedJson, trimmed);
        return {
          success: true,
          data: sanitizedData,
        };
      } catch (err: unknown) {
        if (timer) clearTimeout(timer);

        // 1. Check for authentication error (non-transient: fail fast, do not retry or fallback)
        if (isAuthError(err)) {
          return {
            success: false,
            errorType: 'API_KEY_MISSING',
            message: 'The provided GEMINI_API_KEY was rejected by Google Gemini API (Invalid API Key).',
            setupInstructions: SETUP_INSTRUCTIONS,
          };
        }

        // 2. Check for transient errors (503 Unavailable, 429 Rate Limit, High Demand)
        if (isTransientGeminiError(err)) {
          const errStr = err instanceof Error ? err.message : String(err);
          if (errStr.includes('429') || errStr.toLowerCase().includes('resource_exhausted')) {
            hadRateLimit = true;
          } else {
            hadUnavailable = true;
          }

          // If attempts remain for the current model, apply exponential backoff + jitter and retry
          if (attempt < maxRetriesPerModel - 1) {
            const jitter = Math.floor(Math.random() * 80);
            const backoffMs = initialDelayMs * Math.pow(2, attempt) + jitter;
            await sleep(backoffMs);
            continue;
          }

          // Attempts for this model exhausted; break out to try next fallback model in hierarchy
          break;
        }

        // 3. For non-transient, non-auth errors (e.g. 400 Bad Request or malformed prompt), return immediately
        const errMsg = err instanceof Error ? err.message : String(err);
        return {
          success: false,
          errorType: 'API_ERROR',
          message: `Gemini API communication error: ${errMsg}`,
        };
      }
    }
  }

  // All models and retries in the hierarchy failed with transient errors
  if (hadRateLimit && !hadUnavailable) {
    return {
      success: false,
      errorType: 'RATE_LIMIT',
      message: 'Gemini API rate limit reached (HTTP 429). Please wait a moment and try again.',
    };
  }

  return {
    success: false,
    errorType: 'SERVICE_UNAVAILABLE',
    message:
      'Gemini AI models are currently experiencing high demand (HTTP 503). Retried with fallback models, but services are temporarily busy. Please try again shortly or enter the expense manually.',
  };
}
