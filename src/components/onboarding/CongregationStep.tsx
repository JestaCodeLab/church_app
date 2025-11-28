import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

interface CongregationStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

const CongregationStep: React.FC<CongregationStepProps> = ({
  formData,
  setFormData,
  onNext,
  onBack,
  onSkip,
}) => {
  const ranges = [
    { label: '1-50', value: '1-50' },
    { label: '51-200', value: '51-200' },
    { label: '201-500', value: '201-500' },
    { label: '500+', value: '500+' },
  ];

  const handleRangeSelect = (value: string) => {
    setFormData({ ...formData, congregationSizeRange: value, congregationSize: '' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Step 2 of 4
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: '50%' }} />
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          What is the size of your congregation?
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          This helps us tailor your dashboard experience. You can always change this later.
        </p>
      </div>

      {/* Range Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {ranges.map((range) => (
          <button
            key={range.value}
            onClick={() => handleRangeSelect(range.value)}
            className={`p-4 rounded-lg border-2 font-medium transition-all duration-200 ${
              formData.congregationSizeRange === range.value
                ? 'border-primary-600 dark:border-primary-500 bg-primary-600 dark:bg-primary-500 text-white'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:border-primary-300 dark:hover:border-primary-700'
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
        <span className="px-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
        <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
      </div>

      {/* Specific Number */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Enter a specific number
        </label>
        <input
          type="number"
          value={formData.congregationSize}
          onChange={(e) => setFormData({ ...formData, congregationSize: e.target.value, congregationSizeRange: '' })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          placeholder="e.g., 150"
        />
      </div>

      {/* Navigation - Single Line */}
      <div className="flex items-center justify-between mt-8">
        <button
          onClick={onBack}
          className="flex gap-1 items-center px-6 py-3 text-gray-600 rounded-lg border border-gray-300 dark:border-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </button>

        <div className="flex items-center space-x-3">
          <button
            onClick={onSkip}
            className="px-4 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={onNext}
            disabled={!formData.congregationSize && !formData.congregationSizeRange}
            className="px-8 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            Continue
            <ArrowRight className="ml-2 w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CongregationStep;
