import React, { useState } from 'react';
import { Percent, Loader, CheckCircle, XCircle } from 'lucide-react';
import { discountAPI } from '../../services/api';

interface DiscountCodeInputProps {
  planSlug: string;
  merchantId: string;
  onDiscountApplied: (discount: any) => void;
  onDiscountRemoved: () => void;
  className?: string;
}

const DiscountCodeInput: React.FC<DiscountCodeInputProps> = ({
  planSlug,
  merchantId,
  onDiscountApplied,
  onDiscountRemoved,
  className = ''
}) => {
  const [code, setCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    try {
      setValidating(true);
      setError('');

      const response = await discountAPI.validateDiscount({
        code: code.toUpperCase().trim(),
        planSlug,
        merchantId
      });

      const discountData = response.data.data;
      setAppliedDiscount(discountData);
      onDiscountApplied(discountData);
      setError('');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid discount code');
      setAppliedDiscount(null);
      onDiscountRemoved();
    } finally {
      setValidating(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setAppliedDiscount(null);
    setError('');
    onDiscountRemoved();
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Discount Code (Optional)
      </label>

      {!appliedDiscount ? (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setError('');
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleApply();
                  }
                }}
                placeholder="Enter code"
                disabled={validating}
                className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 uppercase disabled:opacity-50"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <button
              onClick={handleApply}
              disabled={validating || !code.trim()}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {validating ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                'Apply'
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-sm text-red-600 dark:text-red-400">
              <XCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-green-900 dark:text-green-100">
                  {appliedDiscount.code} Applied!
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {appliedDiscount.type === 'percentage' 
                    ? `${appliedDiscount.value}% off` 
                    : `GHS ${appliedDiscount.value} off`
                  }
                </p>
              </div>
            </div>

            <button
              onClick={handleRemove}
              className="text-sm text-green-700 dark:text-green-300 hover:text-green-900 dark:hover:text-green-100 font-medium"
            >
              Remove
            </button>
          </div>

          <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-green-700 dark:text-green-300">Original Price:</span>
              <span className="text-green-900 dark:text-green-100 line-through">
                GHS {appliedDiscount.originalAmount}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-green-700 dark:text-green-300">Discount:</span>
              <span className="text-green-900 dark:text-green-100 font-medium">
                -GHS {appliedDiscount.discountAmount}
              </span>
            </div>
            <div className="flex items-center justify-between font-semibold text-lg mt-2">
              <span className="text-green-900 dark:text-green-100">Final Price:</span>
              <span className="text-green-900 dark:text-green-100">
                GHS {appliedDiscount.finalAmount}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountCodeInput;