import React, { useState } from 'react';
import { Card, CurrencyInput } from '../common';
import {
  type WorkCostCategory,
  type EssentialBillCategory,
  type AIExtractedExpense,
  type ExpenseTargetType,
  WORK_COST_CATEGORIES,
  ESSENTIAL_BILL_CATEGORIES,
} from '../../types';
import { extractExpenseWithAI } from '../../services';
import { formatINR } from '../../utils/currency';
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

interface AIExpenseInputProps {
  onAddWorkCost: (item: { category: WorkCostCategory; title: string; amount: number }) => void;
  onAddEssentialBill: (item: {
    category: EssentialBillCategory;
    title: string;
    amount: number;
    dueWithinHours: number;
  }) => void;
  onSuccessNotification?: (message: string) => void;
}

export const AIExpenseInput: React.FC<AIExpenseInputProps> = ({
  onAddWorkCost,
  onAddEssentialBill,
  onSuccessNotification,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [setupInstructions, setSetupInstructions] = useState<string | null>(null);

  // Extracted preview state (Editable by user before confirmation)
  const [preview, setPreview] = useState<AIExtractedExpense | null>(null);
  const [previewTargetType, setPreviewTargetType] = useState<ExpenseTargetType>('WORK_COST');
  const [previewCategory, setPreviewCategory] = useState<WorkCostCategory | EssentialBillCategory>('FUEL');
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewAmount, setPreviewAmount] = useState<number | null>(null);
  const [previewDueHours, setPreviewDueHours] = useState<number>(24);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  const samplePrompts = [
    'I spent ₹200 on petrol for delivery work today',
    'Recharged 40 rs mobile data for Zomato app',
    'Room rent ₹2,500 due tomorrow',
    'Bought groceries and ration for 450 rs',
  ];

  const handleSelectSample = (sample: string) => {
    setPrompt(sample);
    setErrorMessage(null);
    setSetupInstructions(null);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setErrorMessage('Please describe an expense first (e.g. "₹200 petrol")');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSetupInstructions(null);
    setPreview(null);
    setConfirmationError(null);

    const result = await extractExpenseWithAI(prompt);
    setIsLoading(false);

    if (result.success) {
      const data = result.data;
      setPreview(data);
      setPreviewTargetType(data.targetType);
      setPreviewCategory(data.category);
      setPreviewTitle(data.title);
      setPreviewAmount(data.amount);
      setPreviewDueHours(data.dueWithinHours || 24);
    } else {
      setErrorMessage(result.message);
      if (result.setupInstructions) {
        setSetupInstructions(result.setupInstructions);
      }
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setConfirmationError(null);
  };

  const handleConfirmSave = () => {
    if (!preview) return;

    // Validate amount
    if (previewAmount === null || !Number.isFinite(previewAmount) || previewAmount <= 0) {
      setConfirmationError('Please enter a valid amount greater than ₹0 (Rakam ₹0 se badi honi chahiye).');
      return;
    }

    // Validate title
    const cleanTitle = previewTitle.trim() || 'Expense';

    if (previewTargetType === 'WORK_COST') {
      const validCategory: WorkCostCategory = (
        Object.keys(WORK_COST_CATEGORIES).includes(previewCategory)
          ? previewCategory
          : 'OTHER_WORK'
      ) as WorkCostCategory;

      onAddWorkCost({
        category: validCategory,
        title: cleanTitle,
        amount: previewAmount,
      });

      onSuccessNotification?.(`Added "${cleanTitle}" (${formatINR(previewAmount)}) to Work Running Costs`);
    } else {
      const validCategory: EssentialBillCategory = (
        Object.keys(ESSENTIAL_BILL_CATEGORIES).includes(previewCategory)
          ? previewCategory
          : 'OTHER_BILL'
      ) as EssentialBillCategory;

      const validDueHours = Math.max(1, previewDueHours || 24);

      onAddEssentialBill({
        category: validCategory,
        title: cleanTitle,
        amount: previewAmount,
        dueWithinHours: validDueHours,
      });

      onSuccessNotification?.(`Added "${cleanTitle}" (${formatINR(previewAmount)}) to Essential Bills`);
    }

    // Reset everything after confirmed save
    setPreview(null);
    setPrompt('');
    setConfirmationError(null);
  };

  return (
    <Card className="border border-emerald-500/30 bg-[#121828]/95 shadow-xl shadow-black/50 glow-emerald">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 text-slate-950 flex items-center justify-center shadow-md shadow-emerald-500/20 ring-1 ring-emerald-400/30">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
              <span>Describe an Expense with AI</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                Gemini
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Bol kar ya likh kar kharcha batayein — AI category & amount extract karega
            </p>
          </div>
        </div>
      </div>

      {/* Main Input Form */}
      {!preview && (
        <form onSubmit={handleAnalyze} className="flex flex-col gap-2.5 mt-2">
          <div>
            <label htmlFor="aiExpensePrompt" className="sr-only">
              Describe your expense in natural language
            </label>
            <div className="relative">
              <textarea
                id="aiExpensePrompt"
                rows={2}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={isLoading}
                placeholder="e.g., I spent ₹200 on petrol for delivery today / Kal room rent 2000 dena hai"
                className="w-full text-xs font-medium text-white bg-[#0A0E18] border border-white/10 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 transition-all placeholder:text-slate-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Quick-select chips for gig workers */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Common Examples (Tap to try):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  disabled={isLoading}
                  className="text-[11px] font-medium bg-white/5 hover:bg-emerald-500/15 hover:text-emerald-300 text-slate-300 px-2.5 py-1 rounded-lg border border-white/8 hover:border-emerald-500/30 transition-all text-left active:scale-95"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Error / API Key Missing Notification */}
          {errorMessage && (
            <div
              role="alert"
              className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex flex-col gap-2"
            >
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <strong className="font-bold text-amber-300 block">AI Processing Notice:</strong>
                  <span>{errorMessage}</span>
                </div>
              </div>

              {setupInstructions && (
                <div className="mt-1 pt-2 border-t border-amber-500/20 text-[11px] text-amber-200 font-mono bg-black/40 p-2.5 rounded-lg whitespace-pre-line leading-relaxed">
                  {setupInstructions}
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-1 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="touch-target inline-flex items-center gap-2 text-xs font-black bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-slate-950 px-4 py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/25 disabled:opacity-40 disabled:pointer-events-none"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
                  <span>Analyzing with Gemini AI...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Extract Expense with AI</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ========================================================= */}
      {/* EDITABLE PREVIEW & CONFIRMATION (CRITICAL WORKFLOW)        */}
      {/* User reviews extracted fields before saving to engine     */}
      {/* ========================================================= */}
      {preview && (
        <div className="mt-2 p-4 bg-[#0A0F1D] border-2 border-emerald-500/40 rounded-2xl shadow-xl flex flex-col gap-3.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/8">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Review & Confirm AI Extracted Expense
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancelPreview}
              className="text-xs text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              aria-label="Cancel AI preview"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 font-medium">
            Extracted from: <em className="text-emerald-300">"{preview.rawPrompt}"</em>.
            You can edit any field below before confirming.
          </p>

          {confirmationError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs font-bold text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{confirmationError}</span>
            </div>
          )}

          {/* 1. Target Type Selector */}
          <div>
            <label className="text-xs font-bold text-slate-300 block mb-1.5">
              Expense Destination (Kharcha kahan jodein?)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPreviewTargetType('WORK_COST');
                  if (!Object.keys(WORK_COST_CATEGORIES).includes(previewCategory)) {
                    setPreviewCategory('FUEL');
                  }
                }}
                className={`touch-target py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                  previewTargetType === 'WORK_COST'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                1. Work Cost (Kamai ka kharcha)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreviewTargetType('ESSENTIAL_BILL');
                  if (!Object.keys(ESSENTIAL_BILL_CATEGORIES).includes(previewCategory)) {
                    setPreviewCategory('RATION');
                  }
                }}
                className={`touch-target py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                  previewTargetType === 'ESSENTIAL_BILL'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                2. Essential Bill (Ghar / EMI bill)
              </button>
            </div>
          </div>

          {/* 2. Category Dropdown */}
          <div>
            <label htmlFor="previewCategory" className="text-xs font-bold text-slate-300 block mb-1">
              Category
            </label>
            <select
              id="previewCategory"
              value={previewCategory}
              onChange={(e) => setPreviewCategory(e.target.value as WorkCostCategory | EssentialBillCategory)}
              className="w-full text-xs font-semibold text-white bg-[#0F1424] border border-white/15 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
            >
              {previewTargetType === 'WORK_COST'
                ? Object.entries(WORK_COST_CATEGORIES).map(([key, meta]) => (
                    <option key={key} value={key} className="bg-[#0F1424] text-white">
                      {meta.label} ({meta.hinglish})
                    </option>
                  ))
                : Object.entries(ESSENTIAL_BILL_CATEGORIES).map(([key, meta]) => (
                    <option key={key} value={key} className="bg-[#0F1424] text-white">
                      {meta.label} ({meta.hinglish})
                    </option>
                  ))}
            </select>
          </div>

          {/* 3. Description / Title Input */}
          <div>
            <label htmlFor="previewTitle" className="text-xs font-bold text-slate-300 block mb-1">
              Description / Title
            </label>
            <input
              id="previewTitle"
              type="text"
              value={previewTitle}
              onChange={(e) => setPreviewTitle(e.target.value)}
              placeholder="e.g. Petrol for delivery"
              className="w-full text-xs font-semibold text-white bg-[#0F1424] border border-white/15 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 placeholder:text-slate-500"
            />
          </div>

          {/* 4. Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="previewAmount" className="text-xs font-bold text-slate-300">
                Amount (₹ Rakam)
              </label>
              {previewAmount === null && (
                <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  ⚠️ Amount not found — please enter
                </span>
              )}
            </div>
            <CurrencyInput
              id="previewAmount"
              value={previewAmount ?? 0}
              onChange={(val) => {
                setPreviewAmount(val);
                if (confirmationError) setConfirmationError(null);
              }}
              label="Amount in rupees"
              min={1}
            />
          </div>

          {/* 5. Due Within Hours (Only if Essential Bill) */}
          {previewTargetType === 'ESSENTIAL_BILL' && (
            <div>
              <label htmlFor="previewDueHours" className="text-xs font-bold text-slate-300 block mb-1">
                Due Within (Hours remaining / Kitne ghante mein bharna hai?)
              </label>
              <input
                id="previewDueHours"
                type="number"
                min="1"
                max="720"
                value={previewDueHours}
                onChange={(e) => setPreviewDueHours(parseInt(e.target.value, 10) || 24)}
                className="w-full text-xs font-semibold text-white bg-[#0F1424] border border-white/15 rounded-xl p-3 focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          )}

          {/* Extracted Metadata Pills */}
          {(preview.date || preview.notes) && (
            <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 bg-white/5 p-2.5 rounded-xl border border-white/8">
              {preview.date && <span>📅 Date: <strong className="text-white">{preview.date}</strong></span>}
              {preview.notes && <span>📝 Note: <strong className="text-white">{preview.notes}</strong></span>}
            </div>
          )}

          {/* Confirmation & Cancel Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancelPreview}
              className="touch-target flex-1 py-2.5 px-3 text-xs font-bold text-slate-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="touch-target flex-2 py-2.5 px-4 text-xs font-black text-slate-950 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 rounded-xl shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Confirm & Save Expense</span>
            </button>
          </div>
        </div>
      )}
    </Card>
  );
};
