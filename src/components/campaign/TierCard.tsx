import React from 'react';
import { Check } from 'lucide-react';

interface TierCardProps {
  _id: string;
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  badgeColor?: string;
  isSelected?: boolean;
  currency?: string;
  onSelect: (tierId: string) => void;
}

const colorMap: Record<string, { bg: string; border: string; badge: string; text: string }> = {
  gray: {
    bg: 'bg-gray-50 dark:bg-gray-900/30',
    border: 'border-gray-200 dark:border-gray-700',
    badge: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300',
    text: 'text-gray-600 dark:text-gray-400'
  },
  blue: {
    bg: 'bg-primary-50 dark:bg-primary-900/30',
    border: 'border-primary-200 dark:border-blue-700',
    badge: 'bg-primary-100 dark:bg-blue-800 text-primary-700 dark:text-blue-300',
    text: 'text-primary-600 dark:text-primary-400'
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
    border: 'border-emerald-200 dark:border-emerald-700',
    badge: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/30',
    border: 'border-purple-200 dark:border-primary-700',
    badge: 'bg-purple-100 dark:bg-purple-800 text-primary-700 dark:text-primary-300',
    text: 'text-primary-600 dark:text-primary-400'
  },
  amber: {
    bg: 'bg-amber-50 dark:bg-amber-900/30',
    border: 'border-amber-200 dark:border-amber-700',
    badge: 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300',
    text: 'text-amber-600 dark:text-amber-400'
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/30',
    border: 'border-indigo-200 dark:border-indigo-700',
    badge: 'bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-300',
    text: 'text-indigo-600 dark:text-indigo-400'
  }
};

/**
 * Tier Card Component
 * Displays a donation tier with name, minimum amount, benefits, and selection button
 * Used in both campaign creation and public donation forms
 */
const TierCard: React.FC<TierCardProps> = ({
  _id,
  name,
  minimumAmount,
  description,
  benefits = [],
  badgeColor = 'gray',
  isSelected = false,
  currency = 'GHS',
  onSelect
}) => {
  const colorStyles = colorMap[badgeColor] || colorMap.gray;

  return (
    <div
      onClick={() => onSelect(_id)}
      className={`
        relative p-6 rounded-xl border-2 cursor-pointer
        transition-all duration-200
        ${isSelected
          ? `${colorStyles.border} ${colorStyles.bg} ring-2 ring-offset-2 ring-primary-500`
          : `border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
             hover:border-primary-300 dark:hover:border-primary-600`
        }
      `}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 bg-primary-500 text-white rounded-full p-1">
          <Check className="w-4 h-4" />
        </div>
      )}

      {/* Tier Name */}
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
        {name}
      </h3>

      {/* Amount */}
      <div className="mb-4">
        <p className={`text-2xl font-bold ${colorStyles.text}`}>
          {currency} {minimumAmount.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Minimum donation
        </p>
      </div>

      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          {description}
        </p>
      )}

      {/* Benefits List */}
      {benefits.length > 0 && (
        <div className="space-y-2 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className={`${colorStyles.text} flex-shrink-0 mt-1`}>✓</span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {benefit}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Selection Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(_id);
        }}
        className={`
          w-full py-2 px-4 rounded-lg font-medium transition-colors
          ${isSelected
            ? `${colorStyles.badge} cursor-default`
            : `${colorStyles.text} hover:${colorStyles.bg} border border-current/20`
          }
        `}
      >
        {isSelected ? 'Selected' : 'Choose'}
      </button>
    </div>
  );
};

export default TierCard;
