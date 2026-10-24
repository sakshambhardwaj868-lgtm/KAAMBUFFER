import type { CashFlowInputs, WorkCostItem, EssentialBillItem } from '../types';
import {
  validateCashFlowInputs,
  validateWorkCostItem,
  validateEssentialBillItem,
  isNonNegativeFiniteNumber,
} from '../calculations/validation';
import { DEFAULT_CASH_FLOW_INPUTS } from './defaultState';

const STORAGE_KEY = 'kaambuffer_inputs_v1';

/**
 * Loads saved CashFlowInputs from browser LocalStorage.
 * Validates the loaded structure and falls back safely or recovers partial valid inputs
 * if data is corrupted, empty, or outdated.
 */
export function loadSavedCashFlowInputs(): CashFlowInputs {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_CASH_FLOW_INPUTS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return DEFAULT_CASH_FLOW_INPUTS;
    }

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') {
      return DEFAULT_CASH_FLOW_INPUTS;
    }

    // Direct validation check
    const validation = validateCashFlowInputs(parsed as Partial<CashFlowInputs>);
    if (validation.isValid) {
      return parsed as CashFlowInputs;
    }

    // Gracefully recover valid parts while repairing invalid/missing fields
    const recovered: CashFlowInputs = {
      cashInHand: isNonNegativeFiniteNumber(parsed.cashInHand)
        ? parsed.cashInHand
        : DEFAULT_CASH_FLOW_INPUTS.cashInHand,
      bankBalance: isNonNegativeFiniteNumber(parsed.bankBalance)
        ? parsed.bankBalance
        : DEFAULT_CASH_FLOW_INPUTS.bankBalance,
      expectedNextShiftIncome: isNonNegativeFiniteNumber(parsed.expectedNextShiftIncome)
        ? parsed.expectedNextShiftIncome
        : DEFAULT_CASH_FLOW_INPUTS.expectedNextShiftIncome,
      incomeStressPercent:
        typeof parsed.incomeStressPercent === 'number' &&
        Number.isFinite(parsed.incomeStressPercent) &&
        parsed.incomeStressPercent >= 0 &&
        parsed.incomeStressPercent <= 100
          ? parsed.incomeStressPercent
          : DEFAULT_CASH_FLOW_INPUTS.incomeStressPercent,
      protectedBuffer: isNonNegativeFiniteNumber(parsed.protectedBuffer)
        ? parsed.protectedBuffer
        : DEFAULT_CASH_FLOW_INPUTS.protectedBuffer,
      workCosts: Array.isArray(parsed.workCosts)
        ? parsed.workCosts.filter((item: unknown) => validateWorkCostItem(item as WorkCostItem))
        : DEFAULT_CASH_FLOW_INPUTS.workCosts,
      essentialBills: Array.isArray(parsed.essentialBills)
        ? parsed.essentialBills.filter((item: unknown) => validateEssentialBillItem(item as EssentialBillItem))
        : DEFAULT_CASH_FLOW_INPUTS.essentialBills,
    };

    const recoveredValidation = validateCashFlowInputs(recovered);
    if (recoveredValidation.isValid) {
      return recovered;
    }

    return DEFAULT_CASH_FLOW_INPUTS;
  } catch (error) {
    console.error('Failed to parse KaamBuffer LocalStorage data:', error);
    return DEFAULT_CASH_FLOW_INPUTS;
  }
}

/**
 * Persists CashFlowInputs to browser LocalStorage safely.
 */
export function persistCashFlowInputs(inputs: CashFlowInputs): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }

  try {
    const validation = validateCashFlowInputs(inputs);
    if (!validation.isValid) {
      console.warn('Cannot persist invalid cashflow inputs:', validation.errors);
      return false;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    return true;
  } catch (error) {
    console.error('Failed to persist KaamBuffer state to LocalStorage:', error);
    return false;
  }
}

/**
 * Clears saved data and restores the default seed.
 */
export function clearSavedCashFlowInputs(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear LocalStorage:', e);
    }
  }
}

