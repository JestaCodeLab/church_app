import React, { useState } from 'react';

interface AmountInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  currency?: string;
}

const AmountInput = React.forwardRef<HTMLInputElement, AmountInputProps>(
  ({ value, onChange, currency, onBlur, onFocus, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const numValue = typeof value === 'string' ? value : value.toString();

    const formatNumber = (num: string): string => {
      if (!num || isNaN(Number(num))) return '';
      const parsed = parseFloat(num);
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(parsed);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;
      const cleaned = input.replace(/[^\d.]/g, '');
      onChange(cleaned);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      onBlur?.(e);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      onFocus?.(e);
    };

    return (
      <div className="relative">
        <input
          ref={ref}
          type="text"
          value={isFocused ? numValue : formatNumber(numValue)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          inputMode="decimal"
          className="block w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100 transition-colors"
          {...props}
        />
        {currency && !isFocused && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 pointer-events-none">
            {currency}
          </span>
        )}
      </div>
    );
  }
);

AmountInput.displayName = 'AmountInput';

export default AmountInput;
