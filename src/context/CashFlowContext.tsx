import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { CashFlowInputs, WorkCostItem, EssentialBillItem, ValidationResult } from '../types';
import { loadSavedCashFlowInputs, persistCashFlowInputs, clearSavedCashFlowInputs } from '../storage/localStorage';
import { DEFAULT_CASH_FLOW_INPUTS } from '../storage/defaultState';
import {
  calculateFinancialPlan,
  safeCalculateFinancialPlan,
  type FinancialEngineOutput,
} from '../calculations/engine';
import { validateCashFlowInputs, sanitizeMonetaryInput } from '../calculations/validation';

export interface CashFlowContextType {
  inputs: CashFlowInputs;
  summary: FinancialEngineOutput;
  validation: ValidationResult;
  updateCashInHand: (amount: number) => void;
  updateBankBalance: (amount: number) => void;
  updateExpectedIncome: (amount: number) => void;
  updateStressPercent: (percent: number) => void;
  updateProtectedBuffer: (amount: number) => void;
  addWorkCost: (item: Omit<WorkCostItem, 'id'>) => void;
  updateWorkCost: (id: string, updates: Partial<WorkCostItem>) => void;
  removeWorkCost: (id: string) => void;
  addEssentialBill: (item: Omit<EssentialBillItem, 'id'>) => void;
  updateEssentialBill: (id: string, updates: Partial<EssentialBillItem>) => void;
  removeEssentialBill: (id: string) => void;
  resetToDefaults: () => void;
}


const CashFlowContext = createContext<CashFlowContextType | null>(null);

export const CashFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [inputs, setInputs] = useState<CashFlowInputs>(() => loadSavedCashFlowInputs());

  // Automatically synchronize state to LocalStorage
  useEffect(() => {
    persistCashFlowInputs(inputs);
  }, [inputs]);

  const updateCashInHand = useCallback((amount: number) => {
    setInputs((prev) => ({
      ...prev,
      cashInHand: sanitizeMonetaryInput(amount),
    }));
  }, []);

  const updateBankBalance = useCallback((amount: number) => {
    setInputs((prev) => ({
      ...prev,
      bankBalance: sanitizeMonetaryInput(amount),
    }));
  }, []);

  const updateExpectedIncome = useCallback((amount: number) => {
    setInputs((prev) => ({
      ...prev,
      expectedNextShiftIncome: sanitizeMonetaryInput(amount),
    }));
  }, []);

  const updateStressPercent = useCallback((percent: number) => {
    const validPercent = Math.min(100, Math.max(0, Number.isFinite(percent) ? percent : 0));
    setInputs((prev) => ({
      ...prev,
      incomeStressPercent: validPercent,
    }));
  }, []);

  const updateProtectedBuffer = useCallback((amount: number) => {
    setInputs((prev) => ({
      ...prev,
      protectedBuffer: sanitizeMonetaryInput(amount),
    }));
  }, []);

  const addWorkCost = useCallback((item: Omit<WorkCostItem, 'id'>) => {
    const newItem: WorkCostItem = {
      ...item,
      id: `wc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amount: sanitizeMonetaryInput(item.amount),
    };
    setInputs((prev) => ({
      ...prev,
      workCosts: [newItem, ...prev.workCosts],
    }));
  }, []);

  const updateWorkCost = useCallback((id: string, updates: Partial<WorkCostItem>) => {
    setInputs((prev) => ({
      ...prev,
      workCosts: prev.workCosts.map((cost) =>
        cost.id === id
          ? {
              ...cost,
              ...updates,
              amount: updates.amount !== undefined ? sanitizeMonetaryInput(updates.amount) : cost.amount,
            }
          : cost
      ),
    }));
  }, []);

  const removeWorkCost = useCallback((id: string) => {
    setInputs((prev) => ({
      ...prev,
      workCosts: prev.workCosts.filter((cost) => cost.id !== id),
    }));
  }, []);

  const addEssentialBill = useCallback((item: Omit<EssentialBillItem, 'id'>) => {
    const newItem: EssentialBillItem = {
      ...item,
      id: `bill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      amount: sanitizeMonetaryInput(item.amount),
      dueWithinHours: sanitizeMonetaryInput(item.dueWithinHours, 24),
    };
    setInputs((prev) => ({
      ...prev,
      essentialBills: [newItem, ...prev.essentialBills],
    }));
  }, []);

  const updateEssentialBill = useCallback((id: string, updates: Partial<EssentialBillItem>) => {
    setInputs((prev) => ({
      ...prev,
      essentialBills: prev.essentialBills.map((bill) =>
        bill.id === id
          ? {
              ...bill,
              ...updates,
              amount: updates.amount !== undefined ? sanitizeMonetaryInput(updates.amount) : bill.amount,
              dueWithinHours:
                updates.dueWithinHours !== undefined
                  ? sanitizeMonetaryInput(updates.dueWithinHours, bill.dueWithinHours)
                  : bill.dueWithinHours,
            }
          : bill
      ),
    }));
  }, []);

  const removeEssentialBill = useCallback((id: string) => {
    setInputs((prev) => ({
      ...prev,
      essentialBills: prev.essentialBills.filter((bill) => bill.id !== id),
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    clearSavedCashFlowInputs();
    setInputs(DEFAULT_CASH_FLOW_INPUTS);
  }, []);

  const validation = useMemo(() => validateCashFlowInputs(inputs), [inputs]);

  // Compute deterministic financial engine output safely using Phase B engine
  const summary = useMemo(() => {
    const calc = safeCalculateFinancialPlan(inputs);
    if (calc.success) {
      return calc.data;
    }
    // Fallback: sanitized baseline so UI never crashes on transient invalid input
    return calculateFinancialPlan({
      cashInHand: Math.max(0, sanitizeMonetaryInput(inputs.cashInHand)),
      bankBalance: Math.max(0, sanitizeMonetaryInput(inputs.bankBalance)),
      expectedNextShiftIncome: Math.max(0, sanitizeMonetaryInput(inputs.expectedNextShiftIncome)),
      incomeStressPercent: Math.min(100, Math.max(0, inputs.incomeStressPercent || 0)),
      protectedBuffer: Math.max(0, sanitizeMonetaryInput(inputs.protectedBuffer)),
      workCosts: Array.isArray(inputs.workCosts) ? inputs.workCosts : [],
      essentialBills: Array.isArray(inputs.essentialBills) ? inputs.essentialBills : [],
    });
  }, [inputs]);

  const value = useMemo(
    () => ({
      inputs,
      summary,
      validation,
      updateCashInHand,
      updateBankBalance,
      updateExpectedIncome,
      updateStressPercent,
      updateProtectedBuffer,
      addWorkCost,
      updateWorkCost,
      removeWorkCost,
      addEssentialBill,
      updateEssentialBill,
      removeEssentialBill,
      resetToDefaults,
    }),
    [
      inputs,
      summary,
      validation,
      updateCashInHand,
      updateBankBalance,
      updateExpectedIncome,
      updateStressPercent,
      updateProtectedBuffer,
      addWorkCost,
      updateWorkCost,
      removeWorkCost,
      addEssentialBill,
      updateEssentialBill,
      removeEssentialBill,
      resetToDefaults,
    ]
  );


  return <CashFlowContext.Provider value={value}>{children}</CashFlowContext.Provider>;
};

export const useCashFlow = (): CashFlowContextType => {
  const context = useContext(CashFlowContext);
  if (!context) {
    throw new Error('useCashFlow must be used within a CashFlowProvider');
  }
  return context;
};
