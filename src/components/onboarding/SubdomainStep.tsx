import React from 'react';
import { Globe, Check } from 'lucide-react';

interface SubdomainStepProps {
  formData: any;
  setFormData: (data: any) => void;
  subdomainOptions: string[];
}

const SubdomainStep: React.FC<SubdomainStepProps> = ({
  formData,
  setFormData,
  subdomainOptions,
}) => {
  const handleSelect = (subdomain: string) => {
    setFormData({ ...formData, subdomain });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
          <Globe className="w-8 h-8 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Choose Your Church URL
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select a subdomain for your church's unique web address
        </p>
      </div>

      <div className="space-y-3">
        {subdomainOptions.map((subdomain) => (
          <button
            key={subdomain}
            onClick={() => handleSelect(subdomain)}
            className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
              formData.subdomain === subdomain
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 dark:border-primary-500'
                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-semibold text-lg text-gray-900 dark:text-gray-100">
                    {subdomain}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">.faithconnect.com</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  https://{subdomain}.faithconnect.com
                </p>
              </div>
              {formData.subdomain === subdomain && (
                <div className="ml-4 flex-shrink-0">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <Check className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Custom Subdomain Option */}
      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Or enter your own subdomain
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={formData.subdomain}
            onChange={(e) => {
              const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
              setFormData({ ...formData, subdomain: value });
            }}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 transition-colors font-mono"
            placeholder="yourchurch"
            maxLength={20}
          />
          <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
            .faithconnect.com
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Only lowercase letters, numbers, and hyphens allowed
        </p>
      </div>
    </div>
  );
};

export default SubdomainStep;
