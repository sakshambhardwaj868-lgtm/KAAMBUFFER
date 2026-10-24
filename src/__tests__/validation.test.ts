import { describe, it, expect } from 'vitest';
import {
  isNonNegativeFiniteNumber,
  sanitizeMonetaryInput,
  validateWorkCostItem,
  validateEssentialBillItem,
  validateCashFlowInputs,
} from '../calculations/validation';
import { DEFAULT_CASH_FLOW_INPUTS } from '../storage/defaultState';

describe('Financial Input Validation Routines', () => {
  it('correctly identifies non-negative finite numbers', () => {
    expect(isNonNegativeFiniteNumber(0)).toBe(true);
    expect(isNonNegativeFiniteNumber(500)).toBe(true);
    expect(isNonNegativeFiniteNumber(1250.75)).toBe(true);

    expect(isNonNegativeFiniteNumber(-1)).toBe(false);
    expect(isNonNegativeFiniteNumber(NaN)).toBe(false);
    expect(isNonNegativeFiniteNumber(Infinity)).toBe(false);
    expect(isNonNegativeFiniteNumber(-Infinity)).toBe(false);
    expect(isNonNegativeFiniteNumber('500')).toBe(false);
    expect(isNonNegativeFiniteNumber(null)).toBe(false);
    expect(isNonNegativeFiniteNumber(undefined)).toBe(false);
  });

  it('sanitizes monetary inputs safely', () => {
    expect(sanitizeMonetaryInput(250)).toBe(250);
    expect(sanitizeMonetaryInput('350')).toBe(350);
    expect(sanitizeMonetaryInput('1,250.50')).toBe(1250.5);
    expect(sanitizeMonetaryInput(-50)).toBe(0);
    expect(sanitizeMonetaryInput('invalid', 10)).toBe(10);
    expect(sanitizeMonetaryInput('', 0)).toBe(0);
  });

  it('validates WorkCostItem objects', () => {
    expect(
      validateWorkCostItem({
        id: 'wc-1',
        category: 'FUEL',
        title: 'Petrol',
        amount: 300,
      })
    ).toBe(true);

    expect(
      validateWorkCostItem({
        id: '',
        category: 'FUEL',
        title: 'Petrol',
        amount: 300,
      })
    ).toBe(false);

    expect(
      validateWorkCostItem({
        id: 'wc-1',
        category: 'FUEL',
        title: 'Petrol',
        amount: -100,
      })
    ).toBe(false);
  });

  it('validates EssentialBillItem objects', () => {
    expect(
      validateEssentialBillItem({
        id: 'b-1',
        category: 'RENT',
        title: 'Room Rent',
        amount: 2500,
        dueWithinHours: 48,
      })
    ).toBe(true);

    expect(
      validateEssentialBillItem({
        id: 'b-1',
        category: 'RENT',
        title: 'Room Rent',
        amount: 2500,
        dueWithinHours: -5,
      })
    ).toBe(false);
  });

  it('validates the default cash flow seed successfully', () => {
    const result = validateCashFlowInputs(DEFAULT_CASH_FLOW_INPUTS);
    expect(result.isValid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('flags negative values in CashFlowInputs', () => {
    const invalidInputs = {
      ...DEFAULT_CASH_FLOW_INPUTS,
      cashInHand: -50,
      bankBalance: -100,
      expectedNextShiftIncome: -500,
      protectedBuffer: -200,
    };
    const result = validateCashFlowInputs(invalidInputs);
    expect(result.isValid).toBe(false);
    expect(result.errors.cashInHand).toBeDefined();
    expect(result.errors.bankBalance).toBeDefined();
    expect(result.errors.expectedNextShiftIncome).toBeDefined();
    expect(result.errors.protectedBuffer).toBeDefined();
  });

  it('flags out-of-range and non-numeric income stress percentages', () => {
    const tooLow = validateCashFlowInputs({
      ...DEFAULT_CASH_FLOW_INPUTS,
      incomeStressPercent: -1,
    });
    expect(tooLow.isValid).toBe(false);
    expect(tooLow.errors.incomeStressPercent).toBeDefined();

    const tooHigh = validateCashFlowInputs({
      ...DEFAULT_CASH_FLOW_INPUTS,
      incomeStressPercent: 101,
    });
    expect(tooHigh.isValid).toBe(false);
    expect(tooHigh.errors.incomeStressPercent).toBeDefined();

    const nanStress = validateCashFlowInputs({
      ...DEFAULT_CASH_FLOW_INPUTS,
      incomeStressPercent: NaN,
    });
    expect(nanStress.isValid).toBe(false);
    expect(nanStress.errors.incomeStressPercent).toBeDefined();

    const validBoundaries0 = validateCashFlowInputs({
      ...DEFAULT_CASH_FLOW_INPUTS,
      incomeStressPercent: 0,
    });
    expect(validBoundaries0.isValid).toBe(true);

    const validBoundaries100 = validateCashFlowInputs({
      ...DEFAULT_CASH_FLOW_INPUTS,
      incomeStressPercent: 100,
    });
    expect(validBoundaries100.isValid).toBe(true);
  });

  it('rejects null, non-object, and invalid collection structures', () => {
    expect(validateCashFlowInputs(null).isValid).toBe(false);
    expect(validateCashFlowInputs(undefined).isValid).toBe(false);

    const badWorkCosts = validateCashFlowInputs({
      ...DEFAULT_CASH_FLOW_INPUTS,
      workCosts: 'not-an-array' as unknown as [],
    });
    expect(badWorkCosts.isValid).toBe(false);
    expect(badWorkCosts.errors.workCosts).toBeDefined();

    const badBills = validateCashFlowInputs({
      ...DEFAULT_CASH_FLOW_INPUTS,
      essentialBills: null as unknown as [],
    });
    expect(badBills.isValid).toBe(false);
    expect(badBills.errors.essentialBills).toBeDefined();
  });
});

