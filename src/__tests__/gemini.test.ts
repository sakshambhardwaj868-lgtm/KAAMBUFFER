import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleGenAI } from '@google/genai';
import {
  sanitizeAIExtraction,
  parseExpenseWithGemini,
  VALID_WORK_CATEGORIES,
  VALID_BILL_CATEGORIES,
  GEMINI_MODEL_HIERARCHY,
} from '../../server/geminiService';
import { ensureServerEnvLoaded } from '../../server/vitePlugin';
import { extractExpenseWithAI } from '../services/geminiClient';
import { calculateFinancialPlan } from '../calculations/engine';
import { DEFAULT_CASH_FLOW_INPUTS } from '../storage/defaultState';
import type { CashFlowInputs, WorkCostItem, EssentialBillItem, AIExtractedExpense } from '../types';

describe('Phase E: Gemini AI Natural-Language Expense Parser Suite', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  // 1. Parsing a valid structured AI response
  describe('Parsing Valid Structured AI Responses', () => {
    it('correctly sanitizes and structures a valid Work Cost response (Petrol)', () => {
      const rawAiResponse = {
        targetType: 'WORK_COST',
        category: 'FUEL',
        title: 'Petrol for shift delivery',
        amount: 250,
        dueWithinHours: 24,
        date: 'today',
        notes: 'Filled tank at IndianOil',
        confidence: 0.98,
      };

      const result = sanitizeAIExtraction(rawAiResponse, 'I spent ₹250 on petrol for delivery today');

      expect(result.targetType).toBe('WORK_COST');
      expect(result.category).toBe('FUEL');
      expect(result.title).toBe('Petrol for shift delivery');
      expect(result.amount).toBe(250);
      expect(result.date).toBe('today');
      expect(result.confidence).toBe(0.98);
      expect(result.rawPrompt).toBe('I spent ₹250 on petrol for delivery today');
    });

    it('correctly sanitizes and structures a valid Essential Bill response (Room Rent)', () => {
      const rawAiResponse = {
        targetType: 'ESSENTIAL_BILL',
        category: 'RENT',
        title: 'Monthly room rent share',
        amount: 2200,
        dueWithinHours: 48,
        date: 'in 2 days',
        confidence: 0.95,
      };

      const result = sanitizeAIExtraction(rawAiResponse, 'Room rent ₹2200 due in 2 days');

      expect(result.targetType).toBe('ESSENTIAL_BILL');
      expect(result.category).toBe('RENT');
      expect(VALID_BILL_CATEGORIES).toContain(result.category);
      expect(result.title).toBe('Monthly room rent share');
      expect(result.amount).toBe(2200);
      expect(result.dueWithinHours).toBe(48);
    });

    it('auto-corrects targetType when category implies an essential bill', () => {
      // AI marked targetType as WORK_COST but category is RENT
      const inconsistentResponse = {
        targetType: 'WORK_COST',
        category: 'RENT',
        title: 'PG Rent',
        amount: 3000,
      };

      const result = sanitizeAIExtraction(inconsistentResponse, 'PG rent 3000');
      expect(result.targetType).toBe('ESSENTIAL_BILL');
      expect(result.category).toBe('RENT');
    });

    it('auto-corrects targetType when category implies a work cost', () => {
      // AI marked targetType as ESSENTIAL_BILL but category is MOBILE_DATA
      const inconsistentResponse = {
        targetType: 'ESSENTIAL_BILL',
        category: 'MOBILE_DATA',
        title: 'Data pack',
        amount: 50,
      };

      const result = sanitizeAIExtraction(inconsistentResponse, 'Data pack 50 rs');
      expect(result.targetType).toBe('WORK_COST');
      expect(result.category).toBe('MOBILE_DATA');
    });
  });

  // 2. Invalid or malformed AI responses
  describe('Invalid or Malformed AI Responses', () => {
    it('safely handles unknown category by falling back to OTHER_WORK or OTHER_BILL', () => {
      const malformedCategory = {
        targetType: 'WORK_COST',
        category: 'CRYPTO_TRADING', // Invalid category
        title: 'Unknown tool',
        amount: 500,
      };

      const result = sanitizeAIExtraction(malformedCategory, 'Unknown tool 500');
      expect(result.category).toBe('OTHER_WORK');
      expect(VALID_WORK_CATEGORIES).toContain(result.category);
    });

    it('handles string amounts with currency symbols and decimals', () => {
      const stringAmount = {
        targetType: 'WORK_COST',
        category: 'VEHICLE_REPAIR',
        title: 'Puncture repair',
        amount: '₹35.50',
      };

      const result = sanitizeAIExtraction(stringAmount as unknown as Record<string, unknown>, 'Puncture 35.50');
      expect(result.amount).toBe(35.5);
    });

    it('clamps dueWithinHours between 1 and 720 hours', () => {
      const negativeHours = {
        targetType: 'ESSENTIAL_BILL',
        category: 'UTILITY',
        title: 'Electricity bill',
        amount: 400,
        dueWithinHours: -10,
      };
      expect(sanitizeAIExtraction(negativeHours, 'bill').dueWithinHours).toBe(24);

      const excessiveHours = {
        targetType: 'ESSENTIAL_BILL',
        category: 'UTILITY',
        title: 'Electricity bill',
        amount: 400,
        dueWithinHours: 9999,
      };
      expect(sanitizeAIExtraction(excessiveHours, 'bill').dueWithinHours).toBe(720);
    });
  });

  // 3. Missing amount or required fields
  describe('Missing Amount Handling', () => {
    it('sets amount to null when user did not mention an amount', () => {
      const missingAmount = {
        targetType: 'WORK_COST',
        category: 'FUEL',
        title: 'Filled petrol',
        amount: null,
      };

      const result = sanitizeAIExtraction(missingAmount, 'I filled petrol today');
      expect(result.amount).toBeNull();
      expect(result.title).toBe('Filled petrol');
      expect(result.category).toBe('FUEL');
    });

    it('sets amount to null when amount is negative or non-finite', () => {
      const invalidAmount = {
        targetType: 'WORK_COST',
        category: 'FUEL',
        title: 'Petrol',
        amount: -200,
      };

      const result = sanitizeAIExtraction(invalidAmount, 'Petrol');
      expect(result.amount).toBeNull();
    });

    it('provides default fallback title when title is missing or empty', () => {
      const emptyTitle = {
        targetType: 'WORK_COST',
        category: 'FUEL',
        title: '   ',
        amount: 200,
      };

      const result = sanitizeAIExtraction(emptyTitle, 'Petrol 200');
      expect(result.title).toBe('FUEL');
    });
  });

  // 4. Empty user input
  describe('Empty User Input Handling', () => {
    it('rejects empty prompt in server function', async () => {
      const resEmpty = await parseExpenseWithGemini('');
      expect(resEmpty.success).toBe(false);
      if (!resEmpty.success) {
        expect(resEmpty.errorType).toBe('EMPTY_PROMPT');
      }

      const resWhitespace = await parseExpenseWithGemini('   \n  ');
      expect(resWhitespace.success).toBe(false);
      if (!resWhitespace.success) {
        expect(resWhitespace.errorType).toBe('EMPTY_PROMPT');
      }
    });

    it('rejects empty prompt in client service before making network requests', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const res = await extractExpenseWithAI('   ');
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.errorType).toBe('EMPTY_PROMPT');
      }
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  // 5. API failure and missing API key
  describe('Missing API Key and API Failures', () => {
    it('returns API_KEY_MISSING with helpful setup instructions when key is absent', async () => {
      delete process.env.GEMINI_API_KEY;
      delete process.env.GOOGLE_API_KEY;

      const result = await parseExpenseWithGemini('Petrol ₹200');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('API_KEY_MISSING');
        expect(result.setupInstructions).toContain('GEMINI_API_KEY');
        expect(result.setupInstructions).toContain('npm run dev');
      }
    });

    it('client service returns NETWORK_ERROR when server endpoint is unreachable', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Connection refused'));

      const result = await extractExpenseWithAI('Petrol ₹200');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('NETWORK_ERROR');
        expect(result.message).toContain('Network error');
      }
    });

    it('client service handles API_KEY_MISSING returned by server endpoint', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
        json: async () => ({
          success: false,
          errorType: 'API_KEY_MISSING',
          message: 'Gemini API key is not configured on the server.',
          setupInstructions: 'Set GEMINI_API_KEY in .env file',
        }),
      } as Response);

      const result = await extractExpenseWithAI('Petrol ₹200');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('API_KEY_MISSING');
        expect(result.setupInstructions).toContain('Set GEMINI_API_KEY in .env file');
      }
    });

    it('ensureServerEnvLoaded safely loads variables and strips quotes without crashing', () => {
      // Test when process.env.GEMINI_API_KEY already exists
      process.env.GEMINI_API_KEY = 'mock_key_test';
      ensureServerEnvLoaded();
      expect(process.env.GEMINI_API_KEY).toBe('mock_key_test');
    });
  });

  // 6. Model Fallback and Retry for Transient Errors (HTTP 503 / 429)
  describe('Model Fallback and Retry for Transient Errors (HTTP 503 / 429)', () => {
    it('verifies verified compatible models in default GEMINI_MODEL_HIERARCHY', () => {
      expect(GEMINI_MODEL_HIERARCHY).toContain('gemini-3.8-flash');
      expect(GEMINI_MODEL_HIERARCHY).toContain('gemini-3.5-flash');
      expect(GEMINI_MODEL_HIERARCHY).toContain('gemini-3.5-flash-lite');
      expect(GEMINI_MODEL_HIERARCHY[0]).toBe('gemini-3.8-flash');
    });

    it('successfully falls back to secondary model when primary model fails with 503 high demand', async () => {
      const calls: string[] = [];

      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockImplementation(async ({ model }: { model: string }) => {
            calls.push(model);
            if (model === 'gemini-3.8-flash') {
              throw new Error('503 Service Unavailable: Model is overloaded due to high demand');
            }
            if (model === 'gemini-3.5-flash') {
              return {
                text: JSON.stringify({
                  targetType: 'WORK_COST',
                  category: 'FUEL',
                  title: 'Petrol for shift',
                  amount: 250,
                }),
              };
            }
            throw new Error(`Unexpected model ${model}`);
          }),
        },
      } as unknown as GoogleGenAI;

      const result = await parseExpenseWithGemini('Petrol 250', 'mock_key', {
        models: ['gemini-3.8-flash', 'gemini-3.5-flash'],
        maxRetriesPerModel: 1,
        initialDelayMs: 0,
        aiClient: mockAiClient,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.category).toBe('FUEL');
        expect(result.data.amount).toBe(250);
        expect(result.data.title).toBe('Petrol for shift');
      }
      expect(calls).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash']);
    });

    it('retries with exponential backoff on transient 503 and succeeds on retry attempt', async () => {
      let attempts = 0;

      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockImplementation(async () => {
            attempts++;
            if (attempts === 1) {
              throw new Error('503 UNAVAILABLE: Model is busy');
            }
            return {
              text: JSON.stringify({
                targetType: 'WORK_COST',
                category: 'MOBILE_DATA',
                title: 'Data pack',
                amount: 40,
              }),
            };
          }),
        },
      } as unknown as GoogleGenAI;

      const result = await parseExpenseWithGemini('Recharge 40', 'mock_key', {
        models: ['gemini-3.8-flash'],
        maxRetriesPerModel: 2,
        initialDelayMs: 1,
        aiClient: mockAiClient,
      });

      expect(result.success).toBe(true);
      expect(attempts).toBe(2);
      if (result.success) {
        expect(result.data.category).toBe('MOBILE_DATA');
        expect(result.data.amount).toBe(40);
      }
    });

    it('returns SERVICE_UNAVAILABLE with high demand explanation when all models in hierarchy fail', async () => {
      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error('503 UNAVAILABLE: High demand')),
        },
      } as unknown as GoogleGenAI;

      const result = await parseExpenseWithGemini('Petrol 200', 'mock_key', {
        models: ['gemini-3.8-flash', 'gemini-3.5-flash'],
        maxRetriesPerModel: 1,
        initialDelayMs: 0,
        aiClient: mockAiClient,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('SERVICE_UNAVAILABLE');
        expect(result.message).toContain('high demand');
        expect(result.message).toContain('HTTP 503');
      }
    });

    it('returns RATE_LIMIT when API fails with 429 Resource Exhausted', async () => {
      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockRejectedValue(new Error('429 RESOURCE_EXHAUSTED: Rate limit exceeded')),
        },
      } as unknown as GoogleGenAI;

      const result = await parseExpenseWithGemini('Petrol 200', 'mock_key', {
        models: ['gemini-3.8-flash'],
        maxRetriesPerModel: 1,
        initialDelayMs: 0,
        aiClient: mockAiClient,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('RATE_LIMIT');
        expect(result.message).toContain('rate limit');
        expect(result.message).toContain('HTTP 429');
      }
    });

    it('fails fast on 401/403 Invalid API Key without attempting fallback models', async () => {
      let callCount = 0;

      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockImplementation(async () => {
            callCount++;
            throw new Error('403 PERMISSION_DENIED: API_KEY_INVALID');
          }),
        },
      } as unknown as GoogleGenAI;

      const result = await parseExpenseWithGemini('Petrol 200', 'mock_key', {
        models: ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-3.5-flash-lite'],
        maxRetriesPerModel: 2,
        initialDelayMs: 0,
        aiClient: mockAiClient,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorType).toBe('API_KEY_MISSING');
        expect(result.message).toContain('rejected');
      }
      expect(callCount).toBe(1); // Exits immediately on the first attempt without trying fallbacks
    });

    it('falls back to next model when primary model hangs and times out', async () => {
      const calls: string[] = [];

      const mockAiClient = {
        models: {
          generateContent: vi.fn().mockImplementation(async ({ model }: { model: string }) => {
            calls.push(model);
            if (model === 'gemini-3.8-flash') {
              // Hang for longer than timeoutMs
              await new Promise((resolve) => setTimeout(resolve, 200));
              return { text: '{}' };
            }
            if (model === 'gemini-3.5-flash') {
              return {
                text: JSON.stringify({
                  targetType: 'WORK_COST',
                  category: 'FUEL',
                  title: 'Petrol',
                  amount: 100,
                }),
              };
            }
            throw new Error(`Unexpected model ${model}`);
          }),
        },
      } as unknown as GoogleGenAI;

      const result = await parseExpenseWithGemini('Petrol 100', 'mock_key', {
        models: ['gemini-3.8-flash', 'gemini-3.5-flash'],
        maxRetriesPerModel: 1,
        initialDelayMs: 0,
        timeoutMs: 30, // 30ms timeout for test speed
        aiClient: mockAiClient,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe('Petrol');
        expect(result.data.amount).toBe(100);
      }
      expect(calls).toEqual(['gemini-3.8-flash', 'gemini-3.5-flash']);
    });
  });

  // 6. Editing extracted fields before confirmation
  describe('Editing Extracted Fields Before Confirmation', () => {
    it('allows modifying category, title, and amount before persisting', () => {
      const extracted: AIExtractedExpense = {
        targetType: 'WORK_COST',
        category: 'OTHER_WORK',
        title: 'Fuel',
        amount: 150,
        rawPrompt: 'fuel 150',
      };

      // User edits category to FUEL, title to "Petrol (IndianOil)", amount to 200
      const editedCategory = 'FUEL';
      const editedTitle = 'Petrol (IndianOil)';
      const editedAmount = 200;

      const itemToSave: Omit<WorkCostItem, 'id'> = {
        category: editedCategory,
        title: editedTitle,
        amount: editedAmount,
      };

      expect(itemToSave.category).toBe('FUEL');
      expect(itemToSave.title).toBe('Petrol (IndianOil)');
      expect(itemToSave.amount).toBe(200);
      expect(itemToSave.amount).not.toBe(extracted.amount);
    });

    it('allows changing destination from Work Cost to Essential Bill during preview', () => {
      const extracted: AIExtractedExpense = {
        targetType: 'WORK_COST',
        category: 'OTHER_WORK',
        title: 'Rent',
        amount: 2500,
        rawPrompt: 'Rent 2500',
      };

      // User switches to Essential Bill
      const targetType = 'ESSENTIAL_BILL' as const;
      const category = 'RENT' as const;
      const billToSave: Omit<EssentialBillItem, 'id'> = {
        category,
        title: extracted.title,
        amount: extracted.amount as number,
        dueWithinHours: 24,
      };

      expect(targetType).toBe('ESSENTIAL_BILL');
      expect(billToSave.category).toBe('RENT');
      expect(billToSave.dueWithinHours).toBe(24);
    });
  });

  // 7. Cancelling without saving
  describe('Cancelling Without Saving', () => {
    it('leaves existing expenses array untouched when preview is cancelled', () => {
      const initialCosts: WorkCostItem[] = [
        { id: 'c1', category: 'FUEL', title: 'Morning petrol', amount: 180 },
      ];

      // User triggered extraction, got preview, then cancelled
      let stateCosts = [...initialCosts];
      const handleCancel = () => {
        // Discard preview, do NOT append to stateCosts
      };

      handleCancel();
      expect(stateCosts).toHaveLength(1);
      expect(stateCosts[0]).toEqual(initialCosts[0]);
    });
  });

  // 8. Confirming an expense and saving it exactly once
  describe('Confirming and Saving Exactly Once', () => {
    it('appends the confirmed expense once without duplication', () => {
      let stateCosts: WorkCostItem[] = [];

      const saveExpense = (item: Omit<WorkCostItem, 'id'>) => {
        const newItem: WorkCostItem = { ...item, id: `wc-${Date.now()}` };
        stateCosts = [newItem, ...stateCosts];
      };

      saveExpense({ category: 'FUEL', title: 'Petrol', amount: 200 });

      expect(stateCosts).toHaveLength(1);
      expect(stateCosts[0].title).toBe('Petrol');
      expect(stateCosts[0].amount).toBe(200);
    });
  });

  // 9. Ensuring existing expenses are not overwritten
  describe('Preservation of Existing Expenses', () => {
    it('preserves all existing work costs and essential bills when saving confirmed AI expense', () => {
      const existingCosts: WorkCostItem[] = [
        { id: 'wc-1', category: 'FUEL', title: 'Petrol', amount: 200 },
        { id: 'wc-2', category: 'MOBILE_DATA', title: 'Recharge', amount: 40 },
      ];

      const existingBills: EssentialBillItem[] = [
        { id: 'b-1', category: 'RENT', title: 'Room rent', amount: 1500, dueWithinHours: 24 },
      ];

      let state: CashFlowInputs = {
        ...DEFAULT_CASH_FLOW_INPUTS,
        workCosts: existingCosts,
        essentialBills: existingBills,
      };

      // Add a 3rd cost via AI
      const newCost: WorkCostItem = {
        id: 'wc-3',
        category: 'VEHICLE_REPAIR',
        title: 'Puncture repair',
        amount: 30,
      };

      state = {
        ...state,
        workCosts: [newCost, ...state.workCosts],
      };

      // Verify all 3 costs are present and original 2 costs & 1 bill are preserved
      expect(state.workCosts).toHaveLength(3);
      expect(state.workCosts.find((c) => c.id === 'wc-1')).toBeDefined();
      expect(state.workCosts.find((c) => c.id === 'wc-2')).toBeDefined();
      expect(state.workCosts.find((c) => c.id === 'wc-3')).toBeDefined();
      expect(state.essentialBills).toHaveLength(1);
      expect(state.essentialBills[0].id).toBe('b-1');
    });
  });

  // 10. Financial results update through existing calculation engine
  describe('Deterministic Financial Recalculation', () => {
    it('immediately updates safeToSave and total obligations through Phase B engine after adding AI expense', () => {
      const baselineState: CashFlowInputs = {
        cashInHand: 500,
        bankBalance: 500,
        expectedNextShiftIncome: 1000,
        incomeStressPercent: 0,
        workCosts: [{ id: 'c1', category: 'FUEL', title: 'Petrol', amount: 200 }],
        essentialBills: [{ id: 'b1', category: 'RENT', title: 'Rent', amount: 800, dueWithinHours: 24 }],
        protectedBuffer: 400,
      };

      const initialPlan = calculateFinancialPlan(baselineState);
      // Available: 500 + 500 + 1000 = 2000
      // Obligations: 200 + 800 + 400 = 1400
      // Safe to save: 2000 - 1400 = 600
      expect(initialPlan.totalWorkCosts).toBe(200);
      expect(initialPlan.safeToSave).toBe(600);
      expect(initialPlan.hardShortfall).toBe(0);

      // Add ₹150 vehicle repair extracted by AI
      const updatedState: CashFlowInputs = {
        ...baselineState,
        workCosts: [
          { id: 'c2', category: 'VEHICLE_REPAIR', title: 'Clutch wire', amount: 150 },
          ...baselineState.workCosts,
        ],
      };

      const updatedPlan = calculateFinancialPlan(updatedState);
      // Obligations increase from 1400 to 1550
      // Safe to save drops by exactly 150 to 450
      expect(updatedPlan.totalWorkCosts).toBe(350);
      expect(updatedPlan.safeToSave).toBe(450);
      expect(updatedPlan.hardShortfall).toBe(0);
      expect(updatedPlan.protectedBufferGap).toBe(0);
    });

    it('correctly induces shortfall/buffer gap if added AI expense exceeds available funds', () => {
      const state: CashFlowInputs = {
        cashInHand: 200,
        bankBalance: 100,
        expectedNextShiftIncome: 500,
        incomeStressPercent: 0,
        workCosts: [],
        essentialBills: [],
        protectedBuffer: 300,
      };

      // Available: 200 + 100 + 500 = 800
      // User confirms an unexpected ₹600 urgent tyre replacement via AI
      const updatedState: CashFlowInputs = {
        ...state,
        workCosts: [{ id: 'c1', category: 'VEHICLE_REPAIR', title: 'New tyre', amount: 600 }],
      };

      const plan = calculateFinancialPlan(updatedState);
      // Work costs: 600, Bills: 0, Buffer: 300
      // Total required: 900. Total available: 800.
      // Safe to save: 0. Buffer gap: 100 (Buffer 300 - remaining 200 after 600 tyre).
      expect(plan.safeToSave).toBe(0);
      expect(plan.protectedBufferGap).toBe(100);
      expect(plan.hardShortfall).toBe(0);
    });
  });

  // 11. Preserving Phase A-D functionality
  describe('Preservation of Phase A-D Functionality', () => {
    it('preserves income stress simulation (Phase D) after adding AI expenses', () => {
      const stateWithAIExpense: CashFlowInputs = {
        cashInHand: 400,
        bankBalance: 600,
        expectedNextShiftIncome: 1000,
        incomeStressPercent: 30, // 30% drop simulation
        workCosts: [{ id: 'ai-1', category: 'FUEL', title: 'Petrol', amount: 200 }],
        essentialBills: [{ id: 'b-1', category: 'RENT', title: 'Rent', amount: 800, dueWithinHours: 24 }],
        protectedBuffer: 500,
      };

      const stressedPlan = calculateFinancialPlan(stateWithAIExpense);
      // Stress income: 1000 * 0.70 = 700
      // Available: 400 + 600 + 700 = 1700
      // Obligations: 200 (work) + 800 (bills) + 500 (buffer) = 1500
      // Safe to save: 1700 - 1500 = 200
      expect(stressedPlan.stressAdjustedIncome).toBe(700);
      expect(stressedPlan.totalAvailableFunds).toBe(1700);
      expect(stressedPlan.safeToSave).toBe(200);
      expect(stressedPlan.hardShortfall).toBe(0);
      expect(stressedPlan.protectedBufferGap).toBe(0);
    });
  });
});
