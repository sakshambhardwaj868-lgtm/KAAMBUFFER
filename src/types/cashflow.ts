/**
 * KaamBuffer Core Data Types
 * Designed for Indian Gig Delivery Partners and Drivers (Swiggy, Zomato, Zepto, Blinkit, Uber, Ola)
 */

export type WorkCostCategory = 
  | 'FUEL'            // Petrol / CNG / EV Battery Swap
  | 'MOBILE_DATA'     // Mobile data pack for delivery apps & GPS
  | 'VEHICLE_REPAIR'  // Puncture, oil change, tyre maintenance
  | 'OTHER_WORK';     // Parking, toll, platform bag/uniform

export type EssentialBillCategory = 
  | 'RENT'            // Room rent / PG rent
  | 'VEHICLE_EMI'     // Two-wheeler / auto / car loan or rental EMI
  | 'RATION'          // Family groceries & staple ration
  | 'UTILITY'         // Electricity, water, cylinder gas bill
  | 'OTHER_BILL';     // Medicine, school fees, micro-loan

export interface WorkCostItem {
  id: string;
  category: WorkCostCategory;
  title: string;
  amount: number; // In Indian Rupees (₹), must be non-negative finite number
}

export interface EssentialBillItem {
  id: string;
  category: EssentialBillCategory;
  title: string;
  amount: number; // In Indian Rupees (₹), must be non-negative finite number
  dueWithinHours: number; // Hours remaining until payment deadline
}

export interface CashFlowInputs {
  cashInHand: number;              // Physical cash in pocket (₹)
  bankBalance: number;             // Bank account or UPI balance (₹)
  expectedNextShiftIncome: number; // Projected earnings for next upcoming shift (₹)
  incomeStressPercent: number;     // Simulation stress factor (e.g. 0%, 10%, 20%, 30%)
  workCosts: WorkCostItem[];       // Immediate work running costs needed to complete shift
  essentialBills: EssentialBillItem[]; // Critical life/household bills due soon
  protectedBuffer: number;         // Safety buffer amount to hold untouched (₹)
}

/**
 * Metadata for categories (Hinglish translations, icons, helper text)
 */
export interface CategoryMeta {
  label: string;
  hinglish: string;
  example: string;
}

export const WORK_COST_CATEGORIES: Record<WorkCostCategory, CategoryMeta> = {
  FUEL: {
    label: 'Fuel & EV Swap',
    hinglish: 'Petrol / CNG / Battery swap ka kharcha',
    example: '₹200 - ₹500',
  },
  MOBILE_DATA: {
    label: 'Mobile Recharge',
    hinglish: 'Order receive karne ke liye net pack',
    example: '₹25 - ₹100',
  },
  VEHICLE_REPAIR: {
    label: 'Repairs & Puncture',
    hinglish: 'Hawa, puncture ya brake ki taatkal marammat',
    example: '₹50 - ₹300',
  },
  OTHER_WORK: {
    label: 'Other Work Expenses',
    hinglish: 'Challan, parking, toll ya saman pack',
    example: '₹20 - ₹150',
  },
};

export const ESSENTIAL_BILL_CATEGORIES: Record<EssentialBillCategory, CategoryMeta> = {
  RENT: {
    label: 'Room Rent',
    hinglish: 'Kamre ya makan ka kiraya',
    example: 'Due 1st-5th of month',
  },
  VEHICLE_EMI: {
    label: 'Vehicle EMI / Rent',
    hinglish: 'Gadi ki kisht ya weekly gaadi rent',
    example: 'Due this week',
  },
  RATION: {
    label: 'Ration & Groceries',
    hinglish: 'Ghar ka aata, daal, tel aur doodh',
    example: 'Household essentials',
  },
  UTILITY: {
    label: 'Electricity / Gas',
    hinglish: 'Bijli bill, paani ya LPG cylinder',
    example: 'Monthly utility bill',
  },
  OTHER_BILL: {
    label: 'Other Urgent Bill',
    hinglish: 'Dawaai, bachho ki fees ya zaroori udhar',
    example: 'Emergency requirement',
  },
};

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export type BufferHealthStatus = 'SAFE' | 'CAUTION' | 'SHORTFALL';

export interface FinancialEngineOutput {
  stressAdjustedIncome: number;
  totalAvailableFunds: number;
  totalWorkCosts: number;
  totalEssentialBills: number;
  totalRequiredFunds: number;
  safeToSave: number;
  hardShortfall: number;
  protectedBufferGap: number;
  bufferStatus: BufferHealthStatus;
  totalLiquidity: number;
  netAvailableBeforeShift: number;
  calculatedAt: string;
}
