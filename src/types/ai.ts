import type { WorkCostCategory, EssentialBillCategory } from './cashflow.ts';

export type ExpenseTargetType = 'WORK_COST' | 'ESSENTIAL_BILL';

export interface AIExtractedExpense {
  targetType: ExpenseTargetType;
  category: WorkCostCategory | EssentialBillCategory;
  title: string;
  amount: number | null; // null if amount was not specified or uninterpretable
  dueWithinHours?: number; // for essential bills, defaults to 24
  date?: string; // interpreted timing, e.g. "today", "tomorrow", or ISO date string
  notes?: string;
  rawPrompt: string;
  confidence?: number;
}

export type AIParsingErrorType =
  | 'EMPTY_PROMPT'
  | 'API_KEY_MISSING'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'MALFORMED_RESPONSE'
  | 'RATE_LIMIT'
  | 'SERVICE_UNAVAILABLE';

export interface AIParsingSuccess {
  success: true;
  data: AIExtractedExpense;
}

export interface AIParsingFailure {
  success: false;
  errorType: AIParsingErrorType;
  message: string;
  setupInstructions?: string;
}

export type AIParsingResponse = AIParsingSuccess | AIParsingFailure;
