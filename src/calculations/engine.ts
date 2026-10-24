import type { CashFlowInputs, FinancialEngineOutput, BufferHealthStatus } from '../types';
import { validateCashFlowInputs, CalculationValidationError, sanitizeMonetaryInput } from './validation';

export type { BufferHealthStatus, FinancialEngineOutput };

/**
 * Backward compatibility alias for Phase A consumers.
 */
export type CashFlowCalculationResult = FinancialEngineOutput;

/**
 * Helper to round monetary figures to two decimal places safely, avoiding floating point epsilon inaccuracies.
 */
function roundToTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Executes the complete deterministic financial calculation engine for KaamBuffer.
 *
 * Rules:
 * - StressAdjustedIncome = expectedNextShiftIncome * (1 - incomeStressPercent / 100)
 * - TotalAvailableFunds = cashInHand + bankBalance + StressAdjustedIncome
 * - TotalWorkCosts = sum of all work expenses
 * - TotalEssentialBills = sum of all essential bills
 * - TotalRequiredFunds = TotalWorkCosts + TotalEssentialBills + protectedBuffer
 * - SafeToSave = max(0, TotalAvailableFunds - TotalRequiredFunds)
 * - HardShortfall = max(0, TotalWorkCosts + TotalEssentialBills - TotalAvailableFunds)
 * - ProtectedBufferGap = max(0, protectedBuffer - max(0, TotalAvailableFunds - TotalWorkCosts - TotalEssentialBills))
 *
 * Throws CalculationValidationError if inputs contain negative numbers, NaN, Infinity, or out-of-range percentages.
 */
export function calculateFinancialPlan(inputs: CashFlowInputs): FinancialEngineOutput {
  const validation = validateCashFlowInputs(inputs);
  if (!validation.isValid) {
    throw new CalculationValidationError(validation.errors);
  }

  // 1. StressAdjustedIncome
  const stressAdjustedIncome = roundToTwoDecimals(
    inputs.expectedNextShiftIncome * (1 - inputs.incomeStressPercent / 100)
  );

  // 2. TotalAvailableFunds
  const totalAvailableFunds = roundToTwoDecimals(
    inputs.cashInHand + inputs.bankBalance + stressAdjustedIncome
  );

  // 3. TotalWorkCosts
  const totalWorkCosts = roundToTwoDecimals(
    inputs.workCosts.reduce((acc, item) => acc + item.amount, 0)
  );

  // 4. TotalEssentialBills
  const totalEssentialBills = roundToTwoDecimals(
    inputs.essentialBills.reduce((acc, item) => acc + item.amount, 0)
  );

  // 5. TotalRequiredFunds
  const totalRequiredFunds = roundToTwoDecimals(
    totalWorkCosts + totalEssentialBills + inputs.protectedBuffer
  );

  // 6. SafeToSave = max(0, TotalAvailableFunds - TotalRequiredFunds)
  const safeToSave = Math.max(0, roundToTwoDecimals(totalAvailableFunds - totalRequiredFunds));

  // 7. HardShortfall = max(0, TotalWorkCosts + TotalEssentialBills - TotalAvailableFunds)
  const obligations = roundToTwoDecimals(totalWorkCosts + totalEssentialBills);
  const hardShortfall = Math.max(0, roundToTwoDecimals(obligations - totalAvailableFunds));

  // 8. ProtectedBufferGap = max(0, protectedBuffer - max(0, TotalAvailableFunds - TotalWorkCosts - TotalEssentialBills))
  const surplusAboveObligations = Math.max(0, roundToTwoDecimals(totalAvailableFunds - obligations));
  const protectedBufferGap = Math.max(
    0,
    roundToTwoDecimals(inputs.protectedBuffer - surplusAboveObligations)
  );

  // Buffer health categorization based on mathematical state
  let bufferStatus: BufferHealthStatus = 'SAFE';
  if (hardShortfall > 0) {
    bufferStatus = 'SHORTFALL';
  } else if (protectedBufferGap > 0) {
    bufferStatus = 'CAUTION';
  }

  // Liquidity breakdown for UI presentation
  const totalLiquidity = roundToTwoDecimals(inputs.cashInHand + inputs.bankBalance);
  const netAvailableBeforeShift = roundToTwoDecimals(totalLiquidity - totalWorkCosts);

  return {
    stressAdjustedIncome,
    totalAvailableFunds,
    totalWorkCosts,
    totalEssentialBills,
    totalRequiredFunds,
    safeToSave,
    hardShortfall,
    protectedBufferGap,
    bufferStatus,
    totalLiquidity,
    netAvailableBeforeShift,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Safe version that does not throw, returning a typed result object.
 */
export function safeCalculateFinancialPlan(
  inputs: unknown
): { success: true; data: FinancialEngineOutput } | { success: false; errors: Record<string, string> } {
  try {
    const data = calculateFinancialPlan(inputs as CashFlowInputs);
    return { success: true, data };
  } catch (err) {
    if (err instanceof CalculationValidationError) {
      return { success: false, errors: err.errors };
    }
    return {
      success: false,
      errors: { root: err instanceof Error ? err.message : 'Unknown calculation error' },
    };
  }
}

/**
 * Backward compatibility wrapper for Phase A consumers.
 * Preserves the Phase A baseline scaffolding logic where buffer status is based on
 * ready cash in pocket vs immediate work running costs and upcoming bills.
 */
export function calculateBaselineTotals(inputs: CashFlowInputs): FinancialEngineOutput {
  const sanitizedInputs: CashFlowInputs = {
    cashInHand: sanitizeMonetaryInput(inputs?.cashInHand),
    bankBalance: sanitizeMonetaryInput(inputs?.bankBalance),
    expectedNextShiftIncome: sanitizeMonetaryInput(inputs?.expectedNextShiftIncome),
    incomeStressPercent: Math.min(100, Math.max(0, sanitizeMonetaryInput(inputs?.incomeStressPercent))),
    protectedBuffer: sanitizeMonetaryInput(inputs?.protectedBuffer),
    workCosts: Array.isArray(inputs?.workCosts) ? inputs.workCosts : [],
    essentialBills: Array.isArray(inputs?.essentialBills) ? inputs.essentialBills : [],
  };

  const plan = calculateFinancialPlan(sanitizedInputs);

  // Phase A baseline status logic based on immediate pre-shift liquidity
  let bufferStatus: BufferHealthStatus = 'SAFE';
  if (plan.netAvailableBeforeShift < 0) {
    bufferStatus = 'SHORTFALL';
  } else if (plan.netAvailableBeforeShift < sanitizedInputs.protectedBuffer + plan.totalEssentialBills) {
    bufferStatus = 'CAUTION';
  }

  return {
    ...plan,
    bufferStatus,
  };
}
