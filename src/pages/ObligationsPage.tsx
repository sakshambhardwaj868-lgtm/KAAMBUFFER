import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCashFlow } from '../context';
import { Card, MetricDisplay, CurrencyInput } from '../components/common';
import { AIExpenseInput } from '../components/ai';
import {
  type WorkCostCategory,
  type EssentialBillCategory,
  type WorkCostItem,
  type EssentialBillItem,
  WORK_COST_CATEGORIES,
  ESSENTIAL_BILL_CATEGORIES,
} from '../types';
import { formatINR } from '../utils/currency';
import {
  Fuel,
  Wifi,
  Wrench,
  Package,
  Home,
  Truck,
  ShoppingBag,
  Zap,
  HelpCircle,
  Plus,
  Trash2,
  Edit2,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

export const ObligationsPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    inputs,
    summary,
    addWorkCost,
    updateWorkCost,
    removeWorkCost,
    addEssentialBill,
    updateEssentialBill,
    removeEssentialBill,
  } = useCashFlow();

  // State for adding new Work Cost
  const [showAddWorkModal, setShowAddWorkModal] = useState(false);
  const [newWorkCategory, setNewWorkCategory] = useState<WorkCostCategory>('FUEL');
  const [newWorkTitle, setNewWorkTitle] = useState('');
  const [newWorkAmount, setNewWorkAmount] = useState<number>(100);
  const [workAddError, setWorkAddError] = useState<string | null>(null);

  // State for editing existing Work Cost
  const [editingWorkCost, setEditingWorkCost] = useState<WorkCostItem | null>(null);
  const [workEditError, setWorkEditError] = useState<string | null>(null);

  // State for adding new Essential Bill
  const [showAddBillModal, setShowAddBillModal] = useState(false);
  const [newBillCategory, setNewBillCategory] = useState<EssentialBillCategory>('RATION');
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillAmount, setNewBillAmount] = useState<number>(200);
  const [newBillDueHours, setNewBillDueHours] = useState<number>(24);
  const [billAddError, setBillAddError] = useState<string | null>(null);

  // State for editing existing Essential Bill
  const [editingBill, setEditingBill] = useState<EssentialBillItem | null>(null);
  const [billEditError, setBillEditError] = useState<string | null>(null);

  // Success message toast/banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --- Work Costs Handlers ---
  const handleCreateWorkCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWorkAmount <= 0 || !Number.isFinite(newWorkAmount)) {
      setWorkAddError('Amount must be greater than ₹0 (Rakam ₹0 se badi honi chahiye)');
      return;
    }

    const title =
      newWorkTitle.trim() ||
      WORK_COST_CATEGORIES[newWorkCategory].label;

    addWorkCost({
      category: newWorkCategory,
      title,
      amount: newWorkAmount,
    });

    setNewWorkTitle('');
    setNewWorkAmount(100);
    setWorkAddError(null);
    setShowAddWorkModal(false);
    showNotification('Work expense added successfully');
  };

  const handleStartEditWorkCost = (item: WorkCostItem) => {
    setEditingWorkCost({ ...item });
    setWorkEditError(null);
  };

  const handleSaveEditWorkCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWorkCost) return;

    if (editingWorkCost.amount <= 0 || !Number.isFinite(editingWorkCost.amount)) {
      setWorkEditError('Amount must be greater than ₹0');
      return;
    }

    if (!editingWorkCost.title.trim()) {
      setWorkEditError('Title cannot be empty');
      return;
    }

    updateWorkCost(editingWorkCost.id, {
      category: editingWorkCost.category,
      title: editingWorkCost.title.trim(),
      amount: editingWorkCost.amount,
    });

    setEditingWorkCost(null);
    setWorkEditError(null);
    showNotification('Work expense updated');
  };

  const handleDeleteWorkCost = (id: string, title: string) => {
    removeWorkCost(id);
    showNotification(`Deleted "${title}"`);
  };

  // --- Essential Bills Handlers ---
  const handleCreateEssentialBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBillAmount <= 0 || !Number.isFinite(newBillAmount)) {
      setBillAddError('Amount must be greater than ₹0 (Rakam ₹0 se badi honi chahiye)');
      return;
    }

    if (newBillDueHours <= 0 || !Number.isFinite(newBillDueHours)) {
      setBillAddError('Due hours must be greater than 0');
      return;
    }

    const title =
      newBillTitle.trim() ||
      ESSENTIAL_BILL_CATEGORIES[newBillCategory].label;

    addEssentialBill({
      category: newBillCategory,
      title,
      amount: newBillAmount,
      dueWithinHours: newBillDueHours,
    });

    setNewBillTitle('');
    setNewBillAmount(200);
    setNewBillDueHours(24);
    setBillAddError(null);
    setShowAddBillModal(false);
    showNotification('Essential bill added successfully');
  };

  const handleStartEditBill = (item: EssentialBillItem) => {
    setEditingBill({ ...item });
    setBillEditError(null);
  };

  const handleSaveEditBill = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;

    if (editingBill.amount <= 0 || !Number.isFinite(editingBill.amount)) {
      setBillEditError('Amount must be greater than ₹0');
      return;
    }

    if (!editingBill.title.trim()) {
      setBillEditError('Title cannot be empty');
      return;
    }

    if (editingBill.dueWithinHours <= 0 || !Number.isFinite(editingBill.dueWithinHours)) {
      setBillEditError('Due hours must be greater than 0');
      return;
    }

    updateEssentialBill(editingBill.id, {
      category: editingBill.category,
      title: editingBill.title.trim(),
      amount: editingBill.amount,
      dueWithinHours: editingBill.dueWithinHours,
    });

    setEditingBill(null);
    setBillEditError(null);
    showNotification('Essential bill updated');
  };

  const handleDeleteBill = (id: string, title: string) => {
    removeEssentialBill(id);
    showNotification(`Deleted "${title}"`);
  };

  const renderWorkIcon = (cat: WorkCostCategory) => {
    switch (cat) {
      case 'FUEL':
        return <Fuel className="w-4 h-4 text-amber-400 stroke-[2]" />;
      case 'MOBILE_DATA':
        return <Wifi className="w-4 h-4 text-sky-400 stroke-[2]" />;
      case 'VEHICLE_REPAIR':
        return <Wrench className="w-4 h-4 text-purple-400 stroke-[2]" />;
      case 'OTHER_WORK':
        return <Package className="w-4 h-4 text-slate-300 stroke-[2]" />;
    }
  };

  const renderBillIcon = (cat: EssentialBillCategory) => {
    switch (cat) {
      case 'RENT':
        return <Home className="w-4 h-4 text-rose-400 stroke-[2]" />;
      case 'VEHICLE_EMI':
        return <Truck className="w-4 h-4 text-indigo-400 stroke-[2]" />;
      case 'RATION':
        return <ShoppingBag className="w-4 h-4 text-emerald-400 stroke-[2]" />;
      case 'UTILITY':
        return <Zap className="w-4 h-4 text-amber-400 stroke-[2]" />;
      case 'OTHER_BILL':
        return <HelpCircle className="w-4 h-4 text-slate-300 stroke-[2]" />;
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          className="fixed top-16 left-4 right-4 z-50 max-w-md mx-auto p-3 bg-[#161F33] text-white text-xs font-semibold rounded-2xl shadow-2xl border border-white/10 flex items-center justify-between animate-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div>
        <h2 className="text-xl font-black text-white tracking-tight">
          Next-Shift Essentials & Bills
        </h2>
        <p className="text-xs text-slate-400 font-medium mt-0.5">
          Agli shift poori karne ke liye zaroori kharche aur aane wale bills
        </p>
      </div>

      {/* Summary Outflows Banner */}
      <div className="grid grid-cols-2 gap-3">
        <Card variant="amber">
          <MetricDisplay
            label="Work Costs"
            hinglish="Kamai ke liye zaroori"
            amount={summary.totalWorkCosts}
            variant="amber"
            size="md"
          />
        </Card>
        <Card variant="rose">
          <MetricDisplay
            label="Essential Bills"
            hinglish="Ghar & EMI ke kharche"
            amount={summary.totalEssentialBills}
            variant="crimson"
            size="md"
          />
        </Card>
      </div>

      {/* ========================================================= */}
      {/* AI NATURAL-LANGUAGE EXPENSE ENTRY                         */}
      {/* ========================================================= */}
      <AIExpenseInput
        onAddWorkCost={addWorkCost}
        onAddEssentialBill={addEssentialBill}
        onSuccessNotification={showNotification}
      />

      {/* ========================================================= */}
      {/* SECTION 1: WORK RUNNING COSTS                             */}
      {/* ========================================================= */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              1. Work Running Costs
            </h3>
            <p className="text-[11px] text-slate-400">
              Petrol, mobile data, puncture ya repair
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAddWorkModal(!showAddWorkModal);
              setWorkAddError(null);
            }}
            className="touch-target inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/15 active:scale-95 text-white px-3 py-1.5 rounded-xl transition-all border border-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Cost</span>
          </button>
        </div>

        {/* Add Work Cost Inline Form */}
        {showAddWorkModal && (
          <form
            onSubmit={handleCreateWorkCost}
            className="p-4 bg-[#0E1424] border border-white/10 rounded-2xl flex flex-col gap-3 shadow-xl animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                New Shift Running Expense
              </span>
              <button
                type="button"
                onClick={() => setShowAddWorkModal(false)}
                className="text-xs text-slate-400 hover:text-white font-semibold p-1"
              >
                Cancel
              </button>
            </div>

            {workAddError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{workAddError}</span>
              </div>
            )}

            <div>
              <label htmlFor="newWorkCategory" className="text-xs font-bold text-slate-300 block mb-1">
                Category (Kis cheez ka kharcha?)
              </label>
              <select
                id="newWorkCategory"
                value={newWorkCategory}
                onChange={(e) => setNewWorkCategory(e.target.value as WorkCostCategory)}
                className="w-full rounded-xl border border-white/10 bg-[#0A0D17] p-2.5 text-xs font-semibold text-white touch-target focus:border-emerald-400 focus:outline-hidden"
              >
                {(Object.keys(WORK_COST_CATEGORIES) as WorkCostCategory[]).map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0A0D17] text-white">
                    {WORK_COST_CATEGORIES[cat].label} ({WORK_COST_CATEGORIES[cat].hinglish})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="newWorkTitle" className="text-xs font-bold text-slate-300 block mb-1">
                Description / Title (Optional)
              </label>
              <input
                id="newWorkTitle"
                type="text"
                value={newWorkTitle}
                onChange={(e) => setNewWorkTitle(e.target.value)}
                placeholder={WORK_COST_CATEGORIES[newWorkCategory].label}
                className="w-full rounded-xl border border-white/10 bg-[#0A0D17] p-2.5 text-xs text-white touch-target focus:border-emerald-400 focus:outline-hidden placeholder:text-slate-600"
              />
            </div>

            <CurrencyInput
              id="newWorkAmount"
              label="Amount (₹)"
              value={newWorkAmount}
              onChange={setNewWorkAmount}
              min={1}
            />

            <button
              type="submit"
              className="w-full touch-target bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              Save Work Expense
            </button>
          </form>
        )}

        {/* Edit Work Cost Modal / Inline Form */}
        {editingWorkCost && (
          <form
            onSubmit={handleSaveEditWorkCost}
            className="p-4 bg-[#0E1528] border-2 border-emerald-500/40 rounded-2xl flex flex-col gap-3 shadow-2xl animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-300">
                Edit Shift Running Expense
              </span>
              <button
                type="button"
                onClick={() => setEditingWorkCost(null)}
                className="text-xs text-slate-400 hover:text-white font-semibold p-1"
              >
                Cancel
              </button>
            </div>

            {workEditError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{workEditError}</span>
              </div>
            )}

            <div>
              <label htmlFor="editWorkCategory" className="text-xs font-bold text-slate-300 block mb-1">
                Category
              </label>
              <select
                id="editWorkCategory"
                value={editingWorkCost.category}
                onChange={(e) =>
                  setEditingWorkCost({
                    ...editingWorkCost,
                    category: e.target.value as WorkCostCategory,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0A0D17] p-2.5 text-xs font-semibold text-white touch-target focus:border-emerald-400 focus:outline-hidden"
              >
                {(Object.keys(WORK_COST_CATEGORIES) as WorkCostCategory[]).map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0A0D17] text-white">
                    {WORK_COST_CATEGORIES[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="editWorkTitle" className="text-xs font-bold text-slate-300 block mb-1">
                Description / Title
              </label>
              <input
                id="editWorkTitle"
                type="text"
                value={editingWorkCost.title}
                onChange={(e) =>
                  setEditingWorkCost({
                    ...editingWorkCost,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0A0D17] p-2.5 text-xs text-white touch-target focus:border-emerald-400 focus:outline-hidden"
              />
            </div>

            <CurrencyInput
              id="editWorkAmount"
              label="Amount (₹)"
              value={editingWorkCost.amount}
              onChange={(val) =>
                setEditingWorkCost({
                  ...editingWorkCost,
                  amount: val,
                })
              }
              min={1}
            />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingWorkCost(null)}
                className="flex-1 touch-target bg-white/5 border border-white/10 text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 touch-target bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-2.5 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Work Costs List */}
        <div className="flex flex-col gap-2">
          {inputs.workCosts.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-400 bg-white/3">
              <p className="font-semibold text-slate-300">Koi work kharcha add nahi hai</p>
              <p className="mt-1 text-slate-400">
                Shift shuru karne ke liye petrol, EV battery swap, recharge ya repair ka kharcha jodein.
              </p>
            </div>
          ) : (
            inputs.workCosts.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-[#111726]/90 border border-white/8 hover:border-white/15 rounded-xl flex items-center justify-between shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 ring-1 ring-white/10">
                    {renderWorkIcon(item.category)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {WORK_COST_CATEGORIES[item.category]?.hinglish || item.category}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="num-figure text-sm font-extrabold text-white mr-1">
                    {formatINR(item.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEditWorkCost(item)}
                    className="touch-target p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                    aria-label={`Edit ${item.title}`}
                    title="Edit expense"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteWorkCost(item.id, item.title)}
                    className="touch-target p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                    aria-label={`Delete ${item.title}`}
                    title="Delete expense"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* ========================================================= */}
      {/* SECTION 2: ESSENTIAL BILLS                                */}
      {/* ========================================================= */}
      <section className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider">
              2. Essential Upcoming Bills
            </h3>
            <p className="text-[11px] text-slate-400">
              Kiraya, EMI, ration aur emergency bills
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowAddBillModal(!showAddBillModal);
              setBillAddError(null);
            }}
            className="touch-target inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/15 active:scale-95 text-white px-3 py-1.5 rounded-xl transition-all border border-white/10"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Bill</span>
          </button>
        </div>

        {/* Add Essential Bill Inline Form */}
        {showAddBillModal && (
          <form
            onSubmit={handleCreateEssentialBill}
            className="p-4 bg-[#0E1424] border border-white/10 rounded-2xl flex flex-col gap-3 shadow-xl animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">
                New Upcoming Essential Bill
              </span>
              <button
                type="button"
                onClick={() => setShowAddBillModal(false)}
                className="text-xs text-slate-400 hover:text-white font-semibold p-1"
              >
                Cancel
              </button>
            </div>

            {billAddError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{billAddError}</span>
              </div>
            )}

            <div>
              <label htmlFor="newBillCategory" className="text-xs font-bold text-slate-300 block mb-1">
                Category
              </label>
              <select
                id="newBillCategory"
                value={newBillCategory}
                onChange={(e) => setNewBillCategory(e.target.value as EssentialBillCategory)}
                className="w-full rounded-xl border border-white/10 bg-[#0A0D17] p-2.5 text-xs font-semibold text-white touch-target focus:border-emerald-400 focus:outline-hidden"
              >
                {(Object.keys(ESSENTIAL_BILL_CATEGORIES) as EssentialBillCategory[]).map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0A0D17] text-white">
                    {ESSENTIAL_BILL_CATEGORIES[cat].label} ({ESSENTIAL_BILL_CATEGORIES[cat].hinglish})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="newBillTitle" className="text-xs font-bold text-slate-300 block mb-1">
                Title / Purpose
              </label>
              <input
                id="newBillTitle"
                type="text"
                value={newBillTitle}
                onChange={(e) => setNewBillTitle(e.target.value)}
                placeholder={ESSENTIAL_BILL_CATEGORIES[newBillCategory].label}
                className="w-full rounded-xl border border-white/10 bg-[#0A0D17] p-2.5 text-xs text-white touch-target focus:border-emerald-400 focus:outline-hidden placeholder:text-slate-600"
              />
            </div>

            <CurrencyInput
              id="newBillAmount"
              label="Amount (₹)"
              value={newBillAmount}
              onChange={setNewBillAmount}
              min={1}
            />

            <div>
              <label htmlFor="newBillDueHours" className="text-xs font-bold text-slate-300 block mb-1">
                Due Within: {newBillDueHours} hrs ({Math.round(newBillDueHours / 24)} days)
              </label>
              <input
                id="newBillDueHours"
                type="range"
                min="6"
                max="168"
                step="6"
                value={newBillDueHours}
                onChange={(e) => setNewBillDueHours(Number(e.target.value))}
                className="w-full touch-target"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>6 hrs (Today)</span>
                <span>48 hrs</span>
                <span>7 days (168h)</span>
              </div>
            </div>

            <button
              type="submit"
              className="w-full touch-target bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-95 text-slate-950 font-black text-xs py-2.5 rounded-xl transition-all shadow-md shadow-emerald-500/20"
            >
              Save Essential Bill
            </button>
          </form>
        )}

        {/* Edit Essential Bill Modal / Inline Form */}
        {editingBill && (
          <form
            onSubmit={handleSaveEditBill}
            className="p-4 bg-[#140D18] border-2 border-rose-500/40 rounded-2xl flex flex-col gap-3 shadow-2xl animate-in fade-in"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-300">
                Edit Essential Bill
              </span>
              <button
                type="button"
                onClick={() => setEditingBill(null)}
                className="text-xs text-slate-400 hover:text-white font-semibold p-1"
              >
                Cancel
              </button>
            </div>

            {billEditError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{billEditError}</span>
              </div>
            )}

            <div>
              <label htmlFor="editBillCategory" className="text-xs font-bold text-slate-300 block mb-1">
                Category
              </label>
              <select
                id="editBillCategory"
                value={editingBill.category}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    category: e.target.value as EssentialBillCategory,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0A0D17] p-2.5 text-xs font-semibold text-white touch-target focus:border-emerald-400 focus:outline-hidden"
              >
                {(Object.keys(ESSENTIAL_BILL_CATEGORIES) as EssentialBillCategory[]).map((cat) => (
                  <option key={cat} value={cat} className="bg-[#0A0D17] text-white">
                    {ESSENTIAL_BILL_CATEGORIES[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="editBillTitle" className="text-xs font-bold text-slate-300 block mb-1">
                Title / Purpose
              </label>
              <input
                id="editBillTitle"
                type="text"
                value={editingBill.title}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    title: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-[#0A0D17] p-2.5 text-xs text-white touch-target focus:border-emerald-400 focus:outline-hidden"
              />
            </div>

            <CurrencyInput
              id="editBillAmount"
              label="Amount (₹)"
              value={editingBill.amount}
              onChange={(val) =>
                setEditingBill({
                  ...editingBill,
                  amount: val,
                })
              }
              min={1}
            />

            <div>
              <label htmlFor="editBillDueHours" className="text-xs font-bold text-slate-300 block mb-1">
                Due Within: {editingBill.dueWithinHours} hrs
              </label>
              <input
                id="editBillDueHours"
                type="range"
                min="6"
                max="168"
                step="6"
                value={editingBill.dueWithinHours}
                onChange={(e) =>
                  setEditingBill({
                    ...editingBill,
                    dueWithinHours: Number(e.target.value),
                  })
                }
                className="w-full touch-target"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditingBill(null)}
                className="flex-1 touch-target bg-white/5 border border-white/10 text-slate-300 font-bold text-xs py-2.5 rounded-xl hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 touch-target bg-rose-500 hover:bg-rose-400 text-white font-black text-xs py-2.5 rounded-xl shadow-md shadow-rose-500/20 transition-all"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {/* Essential Bills List */}
        <div className="flex flex-col gap-2">
          {inputs.essentialBills.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-400 bg-white/3">
              <p className="font-semibold text-slate-300">Koi zaroori bill add nahi hai</p>
              <p className="mt-1 text-slate-400">
                Kamre ka kiraya, bike ki EMI, ration ya bijli ka bill jodein taaki buffer calculate ho sake.
              </p>
            </div>
          ) : (
            inputs.essentialBills.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-[#111726]/90 border border-white/8 hover:border-white/15 rounded-xl flex items-center justify-between shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-white/5 ring-1 ring-white/10">
                    {renderBillIcon(item.category)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white leading-tight">
                      {item.title}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {ESSENTIAL_BILL_CATEGORIES[item.category]?.label || item.category}
                      </span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-400">
                        <Clock className="w-2.5 h-2.5" />
                        {item.dueWithinHours}h left
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="num-figure text-sm font-extrabold text-white mr-1">
                    {formatINR(item.amount)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleStartEditBill(item)}
                    className="touch-target p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                    aria-label={`Edit ${item.title}`}
                    title="Edit bill"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBill(item.id, item.title)}
                    className="touch-target p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors inline-flex items-center justify-center"
                    aria-label={`Delete ${item.title}`}
                    title="Delete bill"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Navigation CTA to Dashboard */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full touch-target bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 active:scale-[0.99] text-slate-950 font-black rounded-xl py-3.5 px-4 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all text-sm tracking-tight"
        >
          <span>View Cash Flow Dashboard</span>
          <ArrowRight className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
