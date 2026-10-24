import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadSavedCashFlowInputs,
  persistCashFlowInputs,
  clearSavedCashFlowInputs,
} from '../storage/localStorage';
import { DEFAULT_CASH_FLOW_INPUTS } from '../storage/defaultState';
import type { CashFlowInputs } from '../types';

class LocalStorageMock {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('LocalStorage Persistence and Recovery', () => {
  let mockStorage: LocalStorageMock;

  beforeEach(() => {
    mockStorage = new LocalStorageMock();
    // @ts-expect-error Mocking window.localStorage in node test environment
    globalThis.window = { localStorage: mockStorage };
  });

  it('falls back to DEFAULT_CASH_FLOW_INPUTS when storage is empty', () => {
    const loaded = loadSavedCashFlowInputs();
    expect(loaded).toEqual(DEFAULT_CASH_FLOW_INPUTS);
  });

  it('persists and restores valid user inputs correctly', () => {
    const customInputs: CashFlowInputs = {
      cashInHand: 700,
      bankBalance: 2500,
      expectedNextShiftIncome: 1200,
      incomeStressPercent: 10,
      protectedBuffer: 1000,
      workCosts: [
        { id: 'wc-custom-1', category: 'FUEL', title: 'CNG Auto Fill', amount: 350 },
      ],
      essentialBills: [
        { id: 'eb-custom-1', category: 'RENT', title: 'Room Share Rent', amount: 2000, dueWithinHours: 48 },
      ],
    };

    const persisted = persistCashFlowInputs(customInputs);
    expect(persisted).toBe(true);

    const restored = loadSavedCashFlowInputs();
    expect(restored.cashInHand).toBe(700);
    expect(restored.bankBalance).toBe(2500);
    expect(restored.expectedNextShiftIncome).toBe(1200);
    expect(restored.incomeStressPercent).toBe(10);
    expect(restored.protectedBuffer).toBe(1000);
    expect(restored.workCosts).toHaveLength(1);
    expect(restored.workCosts[0].title).toBe('CNG Auto Fill');
    expect(restored.essentialBills).toHaveLength(1);
    expect(restored.essentialBills[0].amount).toBe(2000);
  });

  it('safely handles and recovers from corrupt JSON without crashing', () => {
    mockStorage.setItem('kaambuffer_inputs_v1', 'INVALID_MALFORMED_JSON{{{');

    const result = loadSavedCashFlowInputs();
    expect(result).toBeDefined();
    expect(result).toEqual(DEFAULT_CASH_FLOW_INPUTS);
  });

  it('safely recovers valid fields when saved payload has partial/corrupt data', () => {
    const partialPayload = {
      cashInHand: 950,
      bankBalance: 3200,
      // missing expectedNextShiftIncome & buffer
      workCosts: [
        { id: 'wc-1', category: 'FUEL', title: 'Petrol', amount: 300 },
        { id: 'bad-item', amount: -500 }, // invalid item should be filtered
      ],
      essentialBills: 'invalid-non-array', // non-array should fall back to default
    };

    mockStorage.setItem('kaambuffer_inputs_v1', JSON.stringify(partialPayload));

    const recovered = loadSavedCashFlowInputs();
    expect(recovered.cashInHand).toBe(950);
    expect(recovered.bankBalance).toBe(3200);
    // Missing fields should safely fill from default seed
    expect(recovered.expectedNextShiftIncome).toBe(DEFAULT_CASH_FLOW_INPUTS.expectedNextShiftIncome);
    expect(recovered.protectedBuffer).toBe(DEFAULT_CASH_FLOW_INPUTS.protectedBuffer);
    // Bad item filtered out
    expect(recovered.workCosts).toHaveLength(1);
    expect(recovered.workCosts[0].title).toBe('Petrol');
    // Non-array falls back to default bills
    expect(recovered.essentialBills).toEqual(DEFAULT_CASH_FLOW_INPUTS.essentialBills);
  });

  it('refuses to persist invalid inputs and returns false', () => {
    const invalidInputs = {
      ...DEFAULT_CASH_FLOW_INPUTS,
      cashInHand: -100, // invalid negative number
    };

    const success = persistCashFlowInputs(invalidInputs);
    expect(success).toBe(false);
  });

  it('clears saved inputs and resets cleanly', () => {
    mockStorage.setItem('kaambuffer_inputs_v1', JSON.stringify(DEFAULT_CASH_FLOW_INPUTS));
    expect(mockStorage.getItem('kaambuffer_inputs_v1')).not.toBeNull();

    clearSavedCashFlowInputs();
    expect(mockStorage.getItem('kaambuffer_inputs_v1')).toBeNull();
  });
});
