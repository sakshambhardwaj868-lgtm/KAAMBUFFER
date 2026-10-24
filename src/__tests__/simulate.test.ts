import { describe, it, expect } from 'vitest';
import { calculateFinancialPlan } from '../calculations/engine';
import { formatINR, getSimulatorExplanation, getSimulatorOutcome } from '../utils';
import type { CashFlowInputs } from '../types';

describe('Phase D: Income-Drop Simulator Suite', () => {
  const sampleGigWorkerInputs: CashFlowInputs = {
    cashInHand: 400,
    bankBalance: 600,
    expectedNextShiftIncome: 1000,
    incomeStressPercent: 0,
    workCosts: [
      { id: 'fuel', category: 'FUEL', title: 'Petrol', amount: 200 },
      { id: 'mobile', category: 'MOBILE_DATA', title: 'Data pack', amount: 50 },
    ],
    essentialBills: [
      { id: 'rent', category: 'RENT', title: 'Room Rent share', amount: 800, dueWithinHours: 24 },
    ],
    protectedBuffer: 500,
  };

  // 1. 0% Income Reduction (Baseline)
  it('correctly calculates 0% income reduction (baseline equality)', () => {
    const baselinePlan = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 0,
    });

    // Income is unchanged: ₹1,000
    expect(baselinePlan.stressAdjustedIncome).toBe(1000);
    // Available funds = 400 + 600 + 1000 = 2000
    expect(baselinePlan.totalAvailableFunds).toBe(2000);
    // Obligations: 250 (work) + 800 (bills) + 500 (buffer) = 1550
    expect(baselinePlan.totalWorkCosts).toBe(250);
    expect(baselinePlan.totalEssentialBills).toBe(800);
    expect(baselinePlan.totalRequiredFunds).toBe(1550);
    // Safe-to-save = 2000 - 1550 = 450
    expect(baselinePlan.safeToSave).toBe(450);
    expect(baselinePlan.hardShortfall).toBe(0);
    expect(baselinePlan.protectedBufferGap).toBe(0);
  });

  // 2. 10%, 30%, and 50% Income Reduction
  it('correctly calculates 10% income reduction scenario', () => {
    const plan10 = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 10,
    });

    // 10% drop: 1000 * 0.90 = 900
    expect(plan10.stressAdjustedIncome).toBe(900);
    // Available: 400 + 600 + 900 = 1900
    expect(plan10.totalAvailableFunds).toBe(1900);
    // Safe-to-save: 1900 - 1550 = 350 (dropped from 450 by exactly 100)
    expect(plan10.safeToSave).toBe(350);
    expect(plan10.hardShortfall).toBe(0);
    expect(plan10.protectedBufferGap).toBe(0);
  });

  it('correctly calculates 30% income reduction scenario with dynamic explanation amounts', () => {
    const plan30 = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 30,
    });

    // 30% drop: 1000 * 0.70 = 700
    expect(plan30.stressAdjustedIncome).toBe(700);
    // Available: 400 + 600 + 700 = 1700
    expect(plan30.totalAvailableFunds).toBe(1700);
    // Safe-to-save: 1700 - 1550 = 150
    expect(plan30.safeToSave).toBe(150);
    expect(plan30.hardShortfall).toBe(0);
    expect(plan30.protectedBufferGap).toBe(0);

    // Verify explanation string uses actual application values
    const explanation = `With a 30% reduction in expected income, your estimated next-shift income falls from ${formatINR(
      sampleGigWorkerInputs.expectedNextShiftIncome
    )} to ${formatINR(plan30.stressAdjustedIncome)}.`;
    expect(explanation).toContain('falls from ₹1,000 to ₹700');
  });

  it('correctly calculates 50% income reduction leading to buffer depletion', () => {
    const plan50 = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 50,
    });

    // 50% drop: 1000 * 0.50 = 500
    expect(plan50.stressAdjustedIncome).toBe(500);
    // Available: 400 + 600 + 500 = 1500
    expect(plan50.totalAvailableFunds).toBe(1500);
    // Obligations: 250 (work) + 800 (bills) = 1050 mandatory costs
    // 1500 available covers 1050 mandatory costs, leaving 450 for buffer (which was 500)
    // Buffer gap = 500 - 450 = 50
    expect(plan50.safeToSave).toBe(0);
    expect(plan50.hardShortfall).toBe(0);
    expect(plan50.protectedBufferGap).toBe(50);
  });

  // 3. 100% Income Reduction (Zero Shift Earnings)
  it('correctly calculates 100% income reduction (severe stress / complete loss of shift)', () => {
    const plan100 = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 100,
    });

    // 100% drop: 0 shift earnings
    expect(plan100.stressAdjustedIncome).toBe(0);
    // Total available = only cash in hand + bank = 400 + 600 = 1000
    expect(plan100.totalAvailableFunds).toBe(1000);
    // Mandatory work + bills = 250 + 800 = 1050
    // Total available (1000) < Mandatory obligations (1050) => Hard shortfall of 50!
    expect(plan100.hardShortfall).toBe(50);
    // Protected buffer gap is full 500 because 0 surplus remained after mandatory obligations
    expect(plan100.protectedBufferGap).toBe(500);
    expect(plan100.safeToSave).toBe(0);
  });

  // 4. Immediate Recalculation Across Gradual Steps
  it('immediately recalculates financial metrics monotonically across intermediate steps', () => {
    const percentages = [0, 10, 20, 30, 40, 50, 75, 100];
    const results = percentages.map((pct) =>
      calculateFinancialPlan({
        ...sampleGigWorkerInputs,
        incomeStressPercent: pct,
      })
    );

    // Stress adjusted income should monotonically decrease
    for (let i = 1; i < results.length; i++) {
      expect(results[i].stressAdjustedIncome).toBeLessThan(results[i - 1].stressAdjustedIncome);
      expect(results[i].totalAvailableFunds).toBeLessThan(results[i - 1].totalAvailableFunds);
    }

    // Safe to save should decrease until 0, then stay 0
    expect(results[0].safeToSave).toBe(450); // 0%
    expect(results[1].safeToSave).toBe(350); // 10%
    expect(results[2].safeToSave).toBe(250); // 20%
    expect(results[3].safeToSave).toBe(150); // 30%
    expect(results[4].safeToSave).toBe(50);  // 40%
    expect(results[5].safeToSave).toBe(0);   // 50% (buffer gap starts)
    expect(results[6].safeToSave).toBe(0);   // 75%
    expect(results[7].safeToSave).toBe(0);   // 100%
  });

  // 5. Correct Outcome Feedback Classification
  it('correctly classifies outcome feedback categories (Surplus, Buffer Gap, Hard Shortfall)', () => {
    // A. Surplus Safe to Save
    const surplusPlan = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 20,
    });
    expect(surplusPlan.safeToSave).toBeGreaterThan(0);
    expect(surplusPlan.hardShortfall).toBe(0);
    expect(surplusPlan.protectedBufferGap).toBe(0);

    // B. Protected Buffer Gap
    const bufferGapPlan = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 50,
    });
    expect(bufferGapPlan.safeToSave).toBe(0);
    expect(bufferGapPlan.hardShortfall).toBe(0);
    expect(bufferGapPlan.protectedBufferGap).toBeGreaterThan(0);

    // C. Hard Shortfall
    const shortfallPlan = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 100,
    });
    expect(shortfallPlan.safeToSave).toBe(0);
    expect(shortfallPlan.hardShortfall).toBeGreaterThan(0);
  });

  // 6. Resetting the Slider to 0%
  it('restores exact 0% baseline values upon reset', () => {
    const initialPlan = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 0,
    });

    // Simulate 75% stress
    const stressedPlan = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 75,
    });
    expect(stressedPlan.safeToSave).not.toBe(initialPlan.safeToSave);

    // Reset to 0%
    const resetPlan = calculateFinancialPlan({
      ...sampleGigWorkerInputs,
      incomeStressPercent: 0,
    });
    expect(resetPlan.stressAdjustedIncome).toBe(initialPlan.stressAdjustedIncome);
    expect(resetPlan.totalAvailableFunds).toBe(initialPlan.totalAvailableFunds);
    expect(resetPlan.safeToSave).toBe(initialPlan.safeToSave);
    expect(resetPlan.hardShortfall).toBe(initialPlan.hardShortfall);
    expect(resetPlan.protectedBufferGap).toBe(initialPlan.protectedBufferGap);
  });

  // 7. Preservation of User Inputs and State Isolation
  it('does not mutate user inputs or saved baseline state during simulation', () => {
    const immutableInputs: CashFlowInputs = Object.freeze({
      cashInHand: 500,
      bankBalance: 700,
      expectedNextShiftIncome: 1200,
      incomeStressPercent: 0,
      workCosts: Object.freeze([
        Object.freeze({ id: 'c1', category: 'FUEL', title: 'Fuel', amount: 200 }),
      ]) as unknown as CashFlowInputs['workCosts'],
      essentialBills: Object.freeze([
        Object.freeze({ id: 'b1', category: 'RENT', title: 'Rent', amount: 900, dueWithinHours: 24 }),
      ]) as unknown as CashFlowInputs['essentialBills'],
      protectedBuffer: 400,
    });

    // Run simulations at different levels without modifying original inputs
    const simPlan30 = calculateFinancialPlan({ ...immutableInputs, incomeStressPercent: 30 });
    const simPlan80 = calculateFinancialPlan({ ...immutableInputs, incomeStressPercent: 80 });

    expect(simPlan30.stressAdjustedIncome).toBe(840);
    expect(simPlan80.stressAdjustedIncome).toBe(240);

    // Original inputs remain intact
    expect(immutableInputs.expectedNextShiftIncome).toBe(1200);
    expect(immutableInputs.cashInHand).toBe(500);
    expect(immutableInputs.bankBalance).toBe(700);
    expect(immutableInputs.incomeStressPercent).toBe(0);
    expect(immutableInputs.workCosts).toHaveLength(1);
    expect(immutableInputs.essentialBills).toHaveLength(1);
    expect(immutableInputs.protectedBuffer).toBe(400);
  });

  // 8. Dynamic Explanation Generation Tests
  it('generates accurate, conversational explanations using real numbers', () => {
    // 0% reduction
    const exp0 = getSimulatorExplanation(1000, 1000, 0);
    expect(exp0).toContain('normal baseline shift earnings of ₹1,000');

    // 10% reduction
    const exp10 = getSimulatorExplanation(1000, 900, 10);
    expect(exp10).toBe('With a 10% reduction in expected income, your estimated next-shift income falls from ₹1,000 to ₹900 (a drop of ₹100).');

    // 30% reduction (prompt example requirement)
    const exp30 = getSimulatorExplanation(1000, 700, 30);
    expect(exp30).toBe('With a 30% reduction in expected income, your estimated next-shift income falls from ₹1,000 to ₹700 (a drop of ₹300).');

    // 50% reduction
    const exp50 = getSimulatorExplanation(1000, 500, 50);
    expect(exp50).toBe('With a 50% reduction in expected income, your estimated next-shift income falls from ₹1,000 to ₹500 (a drop of ₹500).');

    // 100% reduction
    const exp100 = getSimulatorExplanation(1000, 0, 100);
    expect(exp100).toBe('With a 100% reduction in expected income, your estimated next-shift income falls from ₹1,000 to ₹0 (a drop of ₹1,000).');
  });

  // 9. Feedback Status Outcome Category Tests
  it('maps financial results to precise accessible visual feedback outcomes', () => {
    // 1. Surplus
    const surplusOutcome = getSimulatorOutcome({
      ...calculateFinancialPlan(sampleGigWorkerInputs),
      safeToSave: 450,
      hardShortfall: 0,
      protectedBufferGap: 0,
    }, 500);
    expect(surplusOutcome.category).toBe('SURPLUS');
    expect(surplusOutcome.cardVariant).toBe('emerald');
    expect(surplusOutcome.badgeText).toBe('Surplus Safe to Save');

    // 2. Buffer Gap
    const bufferGapOutcome = getSimulatorOutcome({
      ...calculateFinancialPlan(sampleGigWorkerInputs),
      safeToSave: 0,
      hardShortfall: 0,
      protectedBufferGap: 150,
    }, 500);
    expect(bufferGapOutcome.category).toBe('BUFFER_GAP');
    expect(bufferGapOutcome.cardVariant).toBe('amber');
    expect(bufferGapOutcome.badgeText).toBe('Caution: Protected Buffer Gap');

    // 3. Hard Shortfall
    const shortfallOutcome = getSimulatorOutcome({
      ...calculateFinancialPlan(sampleGigWorkerInputs),
      safeToSave: 0,
      hardShortfall: 200,
      protectedBufferGap: 500,
    }, 500);
    expect(shortfallOutcome.category).toBe('HARD_SHORTFALL');
    expect(shortfallOutcome.cardVariant).toBe('rose');
    expect(shortfallOutcome.badgeText).toBe('Critical Deficit / Hard Shortfall');

    // 4. Breakeven
    const breakevenOutcome = getSimulatorOutcome({
      ...calculateFinancialPlan(sampleGigWorkerInputs),
      safeToSave: 0,
      hardShortfall: 0,
      protectedBufferGap: 0,
    }, 500);
    expect(breakevenOutcome.category).toBe('BREAKEVEN');
    expect(breakevenOutcome.cardVariant).toBe('default');
    expect(breakevenOutcome.badgeText).toBe('Breakeven / Zero Surplus');
  });
});
