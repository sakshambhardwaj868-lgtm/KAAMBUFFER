import { describe, it, expect } from 'vitest';
import { calculateFinancialPlan, safeCalculateFinancialPlan } from '../calculations/engine';
import { DEFAULT_CASH_FLOW_INPUTS } from '../storage/defaultState';
import type { CashFlowInputs, WorkCostItem, EssentialBillItem } from '../types';

describe('Phase C Calculation Engine & State Integration', () => {
  it('recalculates totals when user updates cash in hand or bank balance', () => {
    let state: CashFlowInputs = { ...DEFAULT_CASH_FLOW_INPUTS, cashInHand: 400, bankBalance: 1000 };
    let plan = calculateFinancialPlan(state);

    expect(plan.totalLiquidity).toBe(1400);

    // User receives ₹500 cash tip
    state = { ...state, cashInHand: 900 };
    plan = calculateFinancialPlan(state);

    expect(plan.totalLiquidity).toBe(1900);
    expect(plan.totalAvailableFunds).toBe(1900 + plan.stressAdjustedIncome);
  });

  it('recalculates available funds when expected next shift income updates', () => {
    const base: CashFlowInputs = {
      ...DEFAULT_CASH_FLOW_INPUTS,
      cashInHand: 500,
      bankBalance: 500,
      expectedNextShiftIncome: 800,
      incomeStressPercent: 0,
    };

    const initialPlan = calculateFinancialPlan(base);
    expect(initialPlan.totalAvailableFunds).toBe(1800); // 500 + 500 + 800

    // User updates income expectation to ₹1200
    const updatedPlan = calculateFinancialPlan({
      ...base,
      expectedNextShiftIncome: 1200,
    });
    expect(updatedPlan.totalAvailableFunds).toBe(2200); // 500 + 500 + 1200
  });

  it('correctly adds, edits, and deletes work expenses without double-counting', () => {
    let state: CashFlowInputs = {
      ...DEFAULT_CASH_FLOW_INPUTS,
      workCosts: [],
    };

    expect(calculateFinancialPlan(state).totalWorkCosts).toBe(0);

    // 1. Add Petrol (₹250)
    const cost1: WorkCostItem = { id: 'wc-1', category: 'FUEL', title: 'Petrol', amount: 250 };
    state = { ...state, workCosts: [cost1] };
    expect(calculateFinancialPlan(state).totalWorkCosts).toBe(250);

    // 2. Add Mobile Data (₹40)
    const cost2: WorkCostItem = { id: 'wc-2', category: 'MOBILE_DATA', title: 'Data Pack', amount: 40 };
    state = { ...state, workCosts: [...state.workCosts, cost2] };
    expect(calculateFinancialPlan(state).totalWorkCosts).toBe(290);

    // 3. Edit Petrol from ₹250 to ₹300 (e.g. extra distance)
    state = {
      ...state,
      workCosts: state.workCosts.map((c) => (c.id === 'wc-1' ? { ...c, amount: 300 } : c)),
    };
    expect(calculateFinancialPlan(state).totalWorkCosts).toBe(340); // 300 + 40, no double count

    // 4. Delete Mobile Data
    state = {
      ...state,
      workCosts: state.workCosts.filter((c) => c.id !== 'wc-2'),
    };
    expect(calculateFinancialPlan(state).totalWorkCosts).toBe(300);
  });

  it('correctly adds, edits, and deletes essential bills without double-counting', () => {
    let state: CashFlowInputs = {
      ...DEFAULT_CASH_FLOW_INPUTS,
      essentialBills: [],
    };

    expect(calculateFinancialPlan(state).totalEssentialBills).toBe(0);

    // 1. Add Rent (₹2000)
    const bill1: EssentialBillItem = { id: 'b-1', category: 'RENT', title: 'Room Rent', amount: 2000, dueWithinHours: 48 };
    state = { ...state, essentialBills: [bill1] };
    expect(calculateFinancialPlan(state).totalEssentialBills).toBe(2000);

    // 2. Add Groceries (₹600)
    const bill2: EssentialBillItem = { id: 'b-2', category: 'RATION', title: 'Aata & Doodh', amount: 600, dueWithinHours: 24 };
    state = { ...state, essentialBills: [...state.essentialBills, bill2] };
    expect(calculateFinancialPlan(state).totalEssentialBills).toBe(2600);

    // 3. Edit Groceries to ₹750
    state = {
      ...state,
      essentialBills: state.essentialBills.map((b) => (b.id === 'b-2' ? { ...b, amount: 750 } : b)),
    };
    expect(calculateFinancialPlan(state).totalEssentialBills).toBe(2750); // 2000 + 750

    // 4. Delete Rent
    state = {
      ...state,
      essentialBills: state.essentialBills.filter((b) => b.id !== 'b-1'),
    };
    expect(calculateFinancialPlan(state).totalEssentialBills).toBe(750);
  });

  it('ensures hard shortfall and protected buffer gap remain distinct and separate', () => {
    // Case A: Severe deficit (cannot even cover work costs + bills)
    // Available = 1000, WorkCosts = 400, Bills = 1200 (Total obligations = 1600), Buffer = 500
    // Total required = 1600 + 500 = 2100
    const deficitState: CashFlowInputs = {
      cashInHand: 300,
      bankBalance: 200,
      expectedNextShiftIncome: 500,
      incomeStressPercent: 0,
      protectedBuffer: 500,
      workCosts: [{ id: '1', category: 'FUEL', title: 'Petrol', amount: 400 }],
      essentialBills: [{ id: '2', category: 'RENT', title: 'Rent', amount: 1200, dueWithinHours: 24 }],
    };

    const deficitPlan = calculateFinancialPlan(deficitState);
    // HardShortfall = 1600 - 1000 = 600
    expect(deficitPlan.hardShortfall).toBe(600);
    // SafeToSave must be strictly 0 (never negative)
    expect(deficitPlan.safeToSave).toBe(0);
    // Buffer gap is the entire protected buffer since surplus above obligations is 0
    expect(deficitPlan.protectedBufferGap).toBe(500);
    expect(deficitPlan.bufferStatus).toBe('SHORTFALL');

    // Case B: Obligations covered, but buffer is partially breached
    // Available = 1800, Obligations = 1600, Buffer = 500
    // Surplus above obligations = 200
    // BufferGap = 500 - 200 = 300
    // HardShortfall = 0
    // SafeToSave = max(0, 1800 - 2100) = 0
    const cautionState: CashFlowInputs = {
      ...deficitState,
      bankBalance: 1000, // increases available to 1800
    };

    const cautionPlan = calculateFinancialPlan(cautionState);
    expect(cautionPlan.hardShortfall).toBe(0);
    expect(cautionPlan.protectedBufferGap).toBe(300);
    expect(cautionPlan.safeToSave).toBe(0);
    expect(cautionPlan.bufferStatus).toBe('CAUTION');

    // Case C: Full surplus (obligations + buffer covered)
    // Available = 2500, Obligations = 1600, Buffer = 500 (Total required = 2100)
    // SafeToSave = 2500 - 2100 = 400
    // HardShortfall = 0, BufferGap = 0
    const safeState: CashFlowInputs = {
      ...deficitState,
      bankBalance: 1700, // increases available to 2500
    };

    const safePlan = calculateFinancialPlan(safeState);
    expect(safePlan.safeToSave).toBe(400);
    expect(safePlan.hardShortfall).toBe(0);
    expect(safePlan.protectedBufferGap).toBe(0);
    expect(safePlan.bufferStatus).toBe('SAFE');
  });

  it('guarantees SafeToSave is never negative even under astronomical debts', () => {
    const catastrophicState: CashFlowInputs = {
      cashInHand: 0,
      bankBalance: 0,
      expectedNextShiftIncome: 0,
      incomeStressPercent: 0,
      protectedBuffer: 5000,
      workCosts: [{ id: '1', category: 'FUEL', title: 'Petrol', amount: 50000 }],
      essentialBills: [{ id: '2', category: 'RENT', title: 'Rent', amount: 100000, dueWithinHours: 12 }],
    };

    const plan = calculateFinancialPlan(catastrophicState);
    expect(plan.safeToSave).toBe(0);
    expect(plan.safeToSave).not.toBeLessThan(0);
    expect(plan.hardShortfall).toBe(150000);
  });

  it('prevents invalid user inputs from silently producing misleading recommendations', () => {
    const invalidInputs = {
      ...DEFAULT_CASH_FLOW_INPUTS,
      cashInHand: -500,
    };

    const safeResult = safeCalculateFinancialPlan(invalidInputs);
    expect(safeResult.success).toBe(false);
    if (!safeResult.success) {
      expect(safeResult.errors.cashInHand).toBeDefined();
    }
  });
});
