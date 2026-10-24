import { describe, it, expect } from 'vitest';
import {
  calculateBaselineTotals,
  calculateFinancialPlan,
  safeCalculateFinancialPlan,
  CalculationValidationError,
} from '../calculations';
import type { CashFlowInputs } from '../types';

describe('Financial Engine Baseline Scaffolding', () => {
  it('correctly aggregates liquidity, costs, and bills for default seed', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 400,
      bankBalance: 600,
      expectedNextShiftIncome: 800,
      incomeStressPercent: 0,
      protectedBuffer: 300,
      workCosts: [
        { id: '1', category: 'FUEL', title: 'Petrol', amount: 200 },
        { id: '2', category: 'MOBILE_DATA', title: 'Recharge', amount: 50 },
      ],
      essentialBills: [
        { id: '1', category: 'RATION', title: 'Groceries', amount: 350, dueWithinHours: 24 },
      ],
    };

    const res = calculateBaselineTotals(inputs);
    expect(res.totalLiquidity).toBe(1000);
    expect(res.totalWorkCosts).toBe(250);
    expect(res.totalEssentialBills).toBe(350);
    expect(res.netAvailableBeforeShift).toBe(750);
    expect(res.bufferStatus).toBe('SAFE');
  });

  it('triggers SHORTFALL when ready money cannot cover immediate shift costs', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 50,
      bankBalance: 50,
      expectedNextShiftIncome: 500,
      incomeStressPercent: 0,
      protectedBuffer: 200,
      workCosts: [
        { id: '1', category: 'FUEL', title: 'Petrol', amount: 200 },
      ],
      essentialBills: [],
    };

    const res = calculateBaselineTotals(inputs);
    expect(res.totalLiquidity).toBe(100);
    expect(res.totalWorkCosts).toBe(200);
    expect(res.netAvailableBeforeShift).toBe(-100);
    expect(res.bufferStatus).toBe('SHORTFALL');
  });

  it('triggers CAUTION when net available funds dip below buffer + upcoming bills', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 200,
      bankBalance: 300,
      expectedNextShiftIncome: 700,
      incomeStressPercent: 0,
      protectedBuffer: 400,
      workCosts: [
        { id: '1', category: 'FUEL', title: 'Petrol', amount: 200 },
      ],
      essentialBills: [
        { id: '1', category: 'RENT', title: 'Rent part', amount: 300, dueWithinHours: 12 },
      ],
    };

    const res = calculateBaselineTotals(inputs);
    expect(res.totalLiquidity).toBe(500);
    expect(res.totalWorkCosts).toBe(200);
    expect(res.netAvailableBeforeShift).toBe(300); // 300 is less than protectedBuffer(400) + bills(300) = 700
    expect(res.bufferStatus).toBe('CAUTION');
  });
});

describe('Phase B Deterministic Financial Calculation Engine', () => {
  it('Scenario 1: Healthy surplus calculates SafeToSave = ₹1700', () => {
    // Documented fixture:
    // TotalAvailableFunds = 500 (cash) + 1500 (bank) + 1200 (expected income @ 0% stress) = 3200
    // TotalWorkCosts = 250 (Petrol)
    // TotalEssentialBills = 450 (Groceries)
    // TotalRequiredFunds = 250 + 450 + 800 (protectedBuffer) = 1500
    // SafeToSave = max(0, 3200 - 1500) = 1700
    // HardShortfall = max(0, 700 - 3200) = 0
    // ProtectedBufferGap = max(0, 800 - max(0, 3200 - 700)) = 0
    const inputs: CashFlowInputs = {
      cashInHand: 500,
      bankBalance: 1500,
      expectedNextShiftIncome: 1200,
      incomeStressPercent: 0,
      protectedBuffer: 800,
      workCosts: [
        { id: 'wc-1', category: 'FUEL', title: 'Petrol for Shift', amount: 250 },
      ],
      essentialBills: [
        { id: 'eb-1', category: 'RATION', title: 'Ration & Groceries', amount: 450, dueWithinHours: 24 },
      ],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.stressAdjustedIncome).toBe(1200);
    expect(res.totalAvailableFunds).toBe(3200);
    expect(res.totalWorkCosts).toBe(250);
    expect(res.totalEssentialBills).toBe(450);
    expect(res.totalRequiredFunds).toBe(1500);
    expect(res.safeToSave).toBe(1700);
    expect(res.hardShortfall).toBe(0);
    expect(res.protectedBufferGap).toBe(0);
    expect(res.bufferStatus).toBe('SAFE');
  });

  it('Scenario 2: Tight budget calculates SafeToSave = ₹0 and ProtectedBufferGap = ₹1100', () => {
    // Documented fixture:
    // ExpectedShift = 1000 @ 20% stress -> StressAdjustedIncome = 800
    // TotalAvailableFunds = 200 (cash) + 400 (bank) + 800 = 1400
    // TotalWorkCosts = 300, TotalEssentialBills = 700 -> Total obligations = 1000
    // TotalRequiredFunds = 1000 + 1500 (buffer) = 2500
    // SafeToSave = max(0, 1400 - 2500) = 0
    // HardShortfall = max(0, 1000 - 1400) = 0
    // SurplusAboveObligations = max(0, 1400 - 1000) = 400
    // ProtectedBufferGap = max(0, 1500 - 400) = 1100
    const inputs: CashFlowInputs = {
      cashInHand: 200,
      bankBalance: 400,
      expectedNextShiftIncome: 1000,
      incomeStressPercent: 20,
      protectedBuffer: 1500,
      workCosts: [
        { id: 'wc-1', category: 'FUEL', title: 'Petrol', amount: 300 },
      ],
      essentialBills: [
        { id: 'eb-1', category: 'VEHICLE_EMI', title: 'Weekly Two-Wheeler EMI', amount: 700, dueWithinHours: 48 },
      ],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.stressAdjustedIncome).toBe(800);
    expect(res.totalAvailableFunds).toBe(1400);
    expect(res.totalWorkCosts).toBe(300);
    expect(res.totalEssentialBills).toBe(700);
    expect(res.totalRequiredFunds).toBe(2500);
    expect(res.safeToSave).toBe(0);
    expect(res.hardShortfall).toBe(0);
    expect(res.protectedBufferGap).toBe(1100);
    expect(res.bufferStatus).toBe('CAUTION');
  });

  it('Scenario 3: Critical shortfall calculates SafeToSave = ₹0 and HardShortfall = ₹1250', () => {
    // Documented fixture:
    // TotalAvailableFunds = 100 (cash) + 150 (bank) + 500 (expected income @ 0% stress) = 750
    // TotalWorkCosts = 300 (fuel) + 100 (recharge) = 400
    // TotalEssentialBills = 1600 (room rent)
    // Total obligations = 2000
    // ProtectedBuffer = 500 -> TotalRequiredFunds = 2500
    // HardShortfall = max(0, 2000 - 750) = 1250
    // SafeToSave = max(0, 750 - 2500) = 0
    // ProtectedBufferGap = max(0, 500 - max(0, 750 - 2000)) = 500
    const inputs: CashFlowInputs = {
      cashInHand: 100,
      bankBalance: 150,
      expectedNextShiftIncome: 500,
      incomeStressPercent: 0,
      protectedBuffer: 500,
      workCosts: [
        { id: 'wc-1', category: 'FUEL', title: 'Petrol', amount: 300 },
        { id: 'wc-2', category: 'MOBILE_DATA', title: 'Mobile Recharge', amount: 100 },
      ],
      essentialBills: [
        { id: 'eb-1', category: 'RENT', title: 'Room Rent', amount: 1600, dueWithinHours: 12 },
      ],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.totalAvailableFunds).toBe(750);
    expect(res.totalWorkCosts).toBe(400);
    expect(res.totalEssentialBills).toBe(1600);
    expect(res.totalRequiredFunds).toBe(2500);
    expect(res.safeToSave).toBe(0);
    expect(res.hardShortfall).toBe(1250);
    expect(res.protectedBufferGap).toBe(500);
    expect(res.bufferStatus).toBe('SHORTFALL');
  });

  it('Scenario 4: Income-drop scenario calculates SafeToSave = ₹1300', () => {
    // Documented fixture:
    // expectedNextShiftIncome = 2000 @ 30% stress -> StressAdjustedIncome = 1400
    // TotalAvailableFunds = 400 (cash) + 600 (bank) + 1400 = 2400
    // TotalWorkCosts = 200 (fuel), TotalEssentialBills = 400 (groceries), protectedBuffer = 500
    // TotalRequiredFunds = 200 + 400 + 500 = 1100
    // SafeToSave = max(0, 2400 - 1100) = 1300
    // HardShortfall = 0, ProtectedBufferGap = 0
    const inputs: CashFlowInputs = {
      cashInHand: 400,
      bankBalance: 600,
      expectedNextShiftIncome: 2000,
      incomeStressPercent: 30,
      protectedBuffer: 500,
      workCosts: [
        { id: 'wc-1', category: 'FUEL', title: 'Petrol', amount: 200 },
      ],
      essentialBills: [
        { id: 'eb-1', category: 'RATION', title: 'Groceries', amount: 400, dueWithinHours: 24 },
      ],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.stressAdjustedIncome).toBe(1400);
    expect(res.totalAvailableFunds).toBe(2400);
    expect(res.totalRequiredFunds).toBe(1100);
    expect(res.safeToSave).toBe(1300);
    expect(res.hardShortfall).toBe(0);
    expect(res.protectedBufferGap).toBe(0);
  });

  it('Scenario 5: Zero income and zero expenses calculate cleanly', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 0,
      bankBalance: 0,
      expectedNextShiftIncome: 0,
      incomeStressPercent: 0,
      protectedBuffer: 0,
      workCosts: [],
      essentialBills: [],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.stressAdjustedIncome).toBe(0);
    expect(res.totalAvailableFunds).toBe(0);
    expect(res.totalWorkCosts).toBe(0);
    expect(res.totalEssentialBills).toBe(0);
    expect(res.totalRequiredFunds).toBe(0);
    expect(res.safeToSave).toBe(0);
    expect(res.hardShortfall).toBe(0);
    expect(res.protectedBufferGap).toBe(0);
    expect(res.totalLiquidity).toBe(0);
    expect(res.netAvailableBeforeShift).toBe(0);
    expect(res.bufferStatus).toBe('SAFE');
  });

  it('Scenario 6: 0% income stress leaves shift income fully intact', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 100,
      bankBalance: 200,
      expectedNextShiftIncome: 1500,
      incomeStressPercent: 0,
      protectedBuffer: 300,
      workCosts: [],
      essentialBills: [],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.stressAdjustedIncome).toBe(1500);
    expect(res.totalAvailableFunds).toBe(1800);
  });

  it('Scenario 7: 100% income stress completely zeroes shift income contribution', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 300,
      bankBalance: 200,
      expectedNextShiftIncome: 1500,
      incomeStressPercent: 100,
      protectedBuffer: 300,
      workCosts: [],
      essentialBills: [],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.stressAdjustedIncome).toBe(0);
    expect(res.totalAvailableFunds).toBe(500); // 300 cash + 200 bank + 0 income
  });

  it('Scenario 8: Multiple work expenses and essential bills sum properly', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 1000,
      bankBalance: 4000,
      expectedNextShiftIncome: 1200,
      incomeStressPercent: 0,
      protectedBuffer: 1000,
      workCosts: [
        { id: 'wc-1', category: 'FUEL', title: 'Petrol', amount: 300 },
        { id: 'wc-2', category: 'MOBILE_DATA', title: 'Recharge', amount: 50 },
        { id: 'wc-3', category: 'VEHICLE_REPAIR', title: 'Puncture', amount: 150 },
        { id: 'wc-4', category: 'OTHER_WORK', title: 'Parking', amount: 20 },
      ],
      essentialBills: [
        { id: 'eb-1', category: 'RENT', title: 'Room Rent', amount: 3000, dueWithinHours: 72 },
        { id: 'eb-2', category: 'RATION', title: 'Groceries', amount: 1200, dueWithinHours: 48 },
        { id: 'eb-3', category: 'UTILITY', title: 'Bijli Bill', amount: 450, dueWithinHours: 24 },
      ],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.totalWorkCosts).toBe(520); // 300 + 50 + 150 + 20
    expect(res.totalEssentialBills).toBe(4650); // 3000 + 1200 + 450
    expect(res.totalRequiredFunds).toBe(6170); // 520 + 4650 + 1000
    expect(res.totalAvailableFunds).toBe(6200); // 1000 + 4000 + 1200
    expect(res.safeToSave).toBe(30); // 6200 - 6170
    expect(res.hardShortfall).toBe(0);
    expect(res.protectedBufferGap).toBe(0);
  });

  it('Scenario 9: Throws CalculationValidationError on invalid inputs and safeCalculate handles gracefully', () => {
    // Negative cash
    expect(() =>
      calculateFinancialPlan({
        cashInHand: -50,
        bankBalance: 100,
        expectedNextShiftIncome: 500,
        incomeStressPercent: 0,
        protectedBuffer: 200,
        workCosts: [],
        essentialBills: [],
      })
    ).toThrow(CalculationValidationError);

    // Negative bank balance
    expect(() =>
      calculateFinancialPlan({
        cashInHand: 50,
        bankBalance: -100,
        expectedNextShiftIncome: 500,
        incomeStressPercent: 0,
        protectedBuffer: 200,
        workCosts: [],
        essentialBills: [],
      })
    ).toThrow(CalculationValidationError);

    // Out-of-range incomeStressPercent (> 100)
    expect(() =>
      calculateFinancialPlan({
        cashInHand: 50,
        bankBalance: 100,
        expectedNextShiftIncome: 500,
        incomeStressPercent: 120,
        protectedBuffer: 200,
        workCosts: [],
        essentialBills: [],
      })
    ).toThrow(CalculationValidationError);

    // Out-of-range incomeStressPercent (< 0)
    expect(() =>
      calculateFinancialPlan({
        cashInHand: 50,
        bankBalance: 100,
        expectedNextShiftIncome: 500,
        incomeStressPercent: -10,
        protectedBuffer: 200,
        workCosts: [],
        essentialBills: [],
      })
    ).toThrow(CalculationValidationError);

    // Invalid work cost item
    expect(() =>
      calculateFinancialPlan({
        cashInHand: 50,
        bankBalance: 100,
        expectedNextShiftIncome: 500,
        incomeStressPercent: 0,
        protectedBuffer: 200,
        workCosts: [{ id: '1', category: 'FUEL', title: 'Petrol', amount: -50 }],
        essentialBills: [],
      })
    ).toThrow(CalculationValidationError);

    // safeCalculateFinancialPlan returns error object without throwing
    const safeRes = safeCalculateFinancialPlan({
      cashInHand: -100,
      bankBalance: 200,
    });
    expect(safeRes.success).toBe(false);
    if (!safeRes.success) {
      expect(safeRes.errors.cashInHand).toBeDefined();
    }
  });

  it('Scenario 10: SafeToSave is never negative even in massive deficit', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 0,
      bankBalance: 0,
      expectedNextShiftIncome: 0,
      incomeStressPercent: 0,
      protectedBuffer: 3000,
      workCosts: [{ id: '1', category: 'FUEL', title: 'Petrol', amount: 5000 }],
      essentialBills: [{ id: '1', category: 'RENT', title: 'Rent', amount: 10000, dueWithinHours: 24 }],
    };

    const res = calculateFinancialPlan(inputs);

    // Total available = 0, Total required = 18000
    // Raw difference = -18000, but SafeToSave must clamp to 0
    expect(res.safeToSave).toBe(0);
    expect(res.safeToSave).toBeGreaterThanOrEqual(0);
    expect(res.hardShortfall).toBe(15000);
    expect(res.protectedBufferGap).toBe(3000);
  });

  it('Maintains currency precision and prevents floating-point rounding errors', () => {
    const inputs: CashFlowInputs = {
      cashInHand: 100.33,
      bankBalance: 200.67,
      expectedNextShiftIncome: 850.55,
      incomeStressPercent: 15, // 850.55 * 0.85 = 722.9675 -> 722.97
      protectedBuffer: 300.25,
      workCosts: [
        { id: '1', category: 'FUEL', title: 'Petrol', amount: 150.15 },
      ],
      essentialBills: [
        { id: '1', category: 'UTILITY', title: 'Bill', amount: 250.45, dueWithinHours: 24 },
      ],
    };

    const res = calculateFinancialPlan(inputs);

    expect(res.stressAdjustedIncome).toBe(722.97);
    expect(res.totalAvailableFunds).toBe(1023.97); // 100.33 + 200.67 + 722.97
    expect(res.totalWorkCosts).toBe(150.15);
    expect(res.totalEssentialBills).toBe(250.45);
    expect(res.totalRequiredFunds).toBe(700.85); // 150.15 + 250.45 + 300.25
    expect(res.safeToSave).toBe(323.12); // 1023.97 - 700.85
  });
});

