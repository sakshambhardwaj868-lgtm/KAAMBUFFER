import type { CashFlowInputs, ValidationResult, WorkCostItem, EssentialBillItem } from '../types';

/**
 * Custom error class thrown when financial calculations receive invalid or out-of-range inputs.
 */
export class CalculationValidationError extends Error {
  public readonly errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    super(`Financial Calculation Validation Failed: ${Object.entries(errors).map(([k, v]) => `${k} (${v})`).join('; ')}`);
    this.name = 'CalculationValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, CalculationValidationError.prototype);
  }
}

/**
 * Checks if a value is a valid, non-negative finite number.
 */
export function isNonNegativeFiniteNumber(value: unknown): boolean {
  if (typeof value !== 'number') return false;
  return Number.isFinite(value) && !Number.isNaN(value) && value >= 0;
}

/**
 * Parses and sanitizes monetary input string or number safely.
 * Returns fallback (default 0) if invalid or negative.
 */
export function sanitizeMonetaryInput(value: unknown, fallback: number = 0): number {
  if (typeof value === 'number') {
    return isNonNegativeFiniteNumber(value) ? Math.round(value * 100) / 100 : fallback;
  }

  if (typeof value === 'string') {
    const cleaned = value.trim().replace(/,/g, '');
    if (cleaned === '') return fallback;
    const parsed = Number(cleaned);
    return isNonNegativeFiniteNumber(parsed) ? Math.round(parsed * 100) / 100 : fallback;
  }

  return fallback;
}

/**
 * Validates a WorkCostItem object.
 */
export function validateWorkCostItem(item: Partial<WorkCostItem>): boolean {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || item.id.trim() === '') return false;
  if (!item.category) return false;
  if (typeof item.title !== 'string' || item.title.trim() === '') return false;
  if (!isNonNegativeFiniteNumber(item.amount)) return false;
  return true;
}

/**
 * Validates an EssentialBillItem object.
 */
export function validateEssentialBillItem(item: Partial<EssentialBillItem>): boolean {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || item.id.trim() === '') return false;
  if (!item.category) return false;
  if (typeof item.title !== 'string' || item.title.trim() === '') return false;
  if (!isNonNegativeFiniteNumber(item.amount)) return false;
  if (!isNonNegativeFiniteNumber(item.dueWithinHours)) return false;
  return true;
}

/**
 * Validates full CashFlowInputs structure.
 */
export function validateCashFlowInputs(inputs: Partial<CashFlowInputs> | null | undefined): ValidationResult {
  const errors: Record<string, string> = {};

  if (!inputs || typeof inputs !== 'object') {
    return {
      isValid: false,
      errors: { root: 'Inputs must be a valid non-null object' },
    };
  }

  if (!isNonNegativeFiniteNumber(inputs.cashInHand)) {
    errors.cashInHand = 'Cash in hand must be a non-negative finite number';
  }

  if (!isNonNegativeFiniteNumber(inputs.bankBalance)) {
    errors.bankBalance = 'Bank balance must be a non-negative finite number';
  }

  if (!isNonNegativeFiniteNumber(inputs.expectedNextShiftIncome)) {
    errors.expectedNextShiftIncome = 'Expected income must be a non-negative finite number';
  }

  if (
    typeof inputs.incomeStressPercent !== 'number' ||
    !Number.isFinite(inputs.incomeStressPercent) ||
    Number.isNaN(inputs.incomeStressPercent) ||
    inputs.incomeStressPercent < 0 ||
    inputs.incomeStressPercent > 100
  ) {
    errors.incomeStressPercent = 'Income stress percent must be a finite number between 0 and 100';
  }

  if (!isNonNegativeFiniteNumber(inputs.protectedBuffer)) {
    errors.protectedBuffer = 'Protected buffer must be a non-negative finite number';
  }

  if (!Array.isArray(inputs.workCosts)) {
    errors.workCosts = 'Work costs must be an array';
  } else {
    const invalidWorkCostIndex = inputs.workCosts.findIndex(
      (item) => !validateWorkCostItem(item)
    );
    if (invalidWorkCostIndex !== -1) {
      errors.workCosts = `Invalid work cost item at index ${invalidWorkCostIndex}`;
    }
  }

  if (!Array.isArray(inputs.essentialBills)) {
    errors.essentialBills = 'Essential bills must be an array';
  } else {
    const invalidBillIndex = inputs.essentialBills.findIndex(
      (item) => !validateEssentialBillItem(item)
    );
    if (invalidBillIndex !== -1) {
      errors.essentialBills = `Invalid bill item at index ${invalidBillIndex}`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
