import type { CashFlowInputs } from '../types';

/**
 * Realistic default state for an Indian delivery partner / cab driver.
 * Preloaded so first-time users immediately see how KaamBuffer works.
 */
export const DEFAULT_CASH_FLOW_INPUTS: CashFlowInputs = {
  cashInHand: 450,
  bankBalance: 1200,
  expectedNextShiftIncome: 850,
  incomeStressPercent: 0,
  protectedBuffer: 500,
  workCosts: [
    {
      id: 'cost-1',
      category: 'FUEL',
      title: 'Petrol / Fuel for Shift',
      amount: 250,
    },
    {
      id: 'cost-2',
      category: 'MOBILE_DATA',
      title: 'Daily High-Speed Data Pack',
      amount: 30,
    },
  ],
  essentialBills: [
    {
      id: 'bill-1',
      category: 'VEHICLE_EMI',
      title: 'Two-Wheeler Weekly EMI',
      amount: 600,
      dueWithinHours: 36,
    },
    {
      id: 'bill-2',
      category: 'RATION',
      title: 'Flour, Milk & Cooking Oil',
      amount: 200,
      dueWithinHours: 12,
    },
  ],
};
