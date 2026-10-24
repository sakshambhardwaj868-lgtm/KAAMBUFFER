/**
 * Currency and Number Formatting Utilities for Indian Rupees (₹)
 * Uses standard Indian numbering system (e.g., ₹1,00,000 for 1 Lakh)
 */

export function formatINR(amount: number, showDecimals: boolean = false): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '₹0';
  }

  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: showDecimals ? 2 : 0,
    minimumFractionDigits: showDecimals ? 2 : 0,
  });

  return formatter.format(amount);
}

/**
 * Returns plain formatted number string without the ₹ symbol, adhering to Indian grouping
 */
export function formatNumberINR(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Accessible text for screen readers (e.g., "1,250 Indian Rupees")
 */
export function toAccessibleINR(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '0 rupees';
  }
  return `${formatNumberINR(amount)} rupees`;
}
