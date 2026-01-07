/**
 * Currency utility for formatting amounts with merchant's preferred currency
 * Default to GHS (Ghanaian Cedis) if not specified
 */

export const CURRENCY_SYMBOLS: Record<string, string> = {
  'GHS': '₵',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'JPY': '¥',
  'INR': '₹',
  'NGN': '₦',
  'ZAR': 'R',
  'KES': 'KSh',
};

/**
 * Get currency symbol for a given currency code
 * @param currencyCode - ISO 4217 currency code (e.g., 'GHS', 'USD')
 * @returns Currency symbol or code if symbol not found
 */
export const getCurrencySymbol = (currencyCode: string = 'GHS'): string => {
  return CURRENCY_SYMBOLS[currencyCode] || currencyCode;
};

/**
 * Format amount with currency symbol
 * @param amount - The numeric amount to format
 * @param currencyCode - ISO 4217 currency code (default: 'GHS')
 * @param locale - Locale for number formatting (default: 'en-US')
 * @returns Formatted currency string (e.g., '₵1,234.50')
 */
export const formatCurrency = (
  amount: number,
  currencyCode: string = 'GHS',
  locale: string = 'en-US'
): string => {
  const symbol = getCurrencySymbol(currencyCode);
  
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
  
  return `${symbol}${formatted}`;
};

/**
 * Format amount without symbol (just the number)
 * @param amount - The numeric amount to format
 * @param locale - Locale for number formatting (default: 'en-US')
 * @returns Formatted number string (e.g., '1,234.50')
 */
export const formatAmount = (
  amount: number,
  locale: string = 'en-US'
): string => {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Get merchant's default currency from context or localStorage
 * Falls back to 'GHS' if not found
 */
export const getMerchantCurrency = (): string => {
  try {
    // Check if stored in localStorage
    const stored = localStorage.getItem('merchantCurrency');
    if (stored) return stored;
    
    // Default to GHS
    return 'GHS';
  } catch {
    return 'GHS';
  }
};

/**
 * Set merchant's currency preference
 */
export const setMerchantCurrency = (currencyCode: string): void => {
  try {
    localStorage.setItem('merchantCurrency', currencyCode);
  } catch {
    console.error('Failed to set merchant currency');
  }
};
