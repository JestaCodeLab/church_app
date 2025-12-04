import React from 'react';
import { ArrowRight, CheckCircle, Info } from 'lucide-react';

interface SubdomainStepProps {
  formData: any;
  setFormData: (data: any) => void;
  subdomainOptions: string[];
  churchName: string;
  onNext: () => void;
  onBack: () => void;
  handleLogout: () => void;
}

const SubdomainStep: React.FC<SubdomainStepProps> = ({
  formData,
  setFormData,
  subdomainOptions,
  churchName,
  onNext,
  handleLogout
}) => {
  const [customMode, setCustomMode] = React.useState(false);

  const handleSelect = (subdomain: string) => {
    setFormData({ ...formData, subdomain });
    setCustomMode(false);
  };

  const handleCustomInput = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setFormData({ ...formData, subdomain: sanitized });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
      {/* Progress */}
      <div className="mb-8">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
          Step 1 of 4
        </p>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-300" style={{ width: '25%' }} />
        </div>
      </div>

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome! Let's set up your account.
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Confirm your church’s name and select a preferred domain for your dashboard.
        </p>
      </div>

      {/* Church Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
          Church Name
        </label>
        <input
          type="text"
          value={formData.churchName || churchName}
          onChange={(e) => setFormData({ ...formData, churchName: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors"
          placeholder="Grace Community Church"
        />
      </div>

       {/* Tagline */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Church Tagline
        </label>
        <input
          type="text"
          value={formData.tagline || ''}
          onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          placeholder="Building faith communities together"
          maxLength={100}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {formData.tagline?.length || 0}/100 characters
        </p>
      </div>

      {/* Subdomain Options */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
          <span>Preferred Web Address</span>
          <button
            type="button"
            aria-label="Dashboard address info"
            className="ml-2 text-blue-500 hover:text-blue-600 dark:text-blue-300 focus:outline-none group relative"
          >
            <Info className="w-4 h-4" />

            {/* Tooltip: appears on hover and focus via group-hover / group-focus; supports dark mode */}
            <span
              role="tooltip"
              className="absolute left-1/2 top-full z-10 -translate-x-1/2 mt-2 w-max max-w-xs px-2 py-1 text-xs text-gray-800 bg-gray-200 rounded shadow-lg opacity-0 pointer-events-none transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 dark:bg-gray-900 dark:text-gray-100 dark:shadow-md"
            >
              A web address (domain) you will access your dashboard on
            </span>
          </button>
        </label>
        <div className="space-y-3">
          {subdomainOptions.map((subdomain) => (
            <button
              key={subdomain}
              onClick={() => handleSelect(subdomain)}
              className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left flex items-center justify-between ${
                formData.subdomain === subdomain && !customMode
                  ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 bg-white dark:bg-gray-700'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  formData.subdomain === subdomain && !customMode
                    ? 'border-primary-600 dark:border-primary-500 bg-primary-600 dark:bg-primary-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}>
                  {formData.subdomain === subdomain && !customMode && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {subdomain}.{process.env.REACT_APP_PROJECT_DOMAIN || 'thechurchhq.com'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Suggested</p>
                </div>
              </div>
              {formData.subdomain === subdomain && !customMode && (
                <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-500" />
              )}
            </button>
          ))}

          {/* Custom Subdomain */}
          <div className={`p-4 rounded-lg border-2 transition-all ${
            customMode || (!subdomainOptions.includes(formData.subdomain) && formData.subdomain)
              ? 'border-primary-600 dark:border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-700'
          }`}>
            <div className="flex items-center space-x-3 mb-3">
              <button
                onClick={() => setCustomMode(true)}
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  customMode || (!subdomainOptions.includes(formData.subdomain) && formData.subdomain)
                    ? 'border-primary-600 dark:border-primary-500 bg-primary-600 dark:bg-primary-500'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                {(customMode || (!subdomainOptions.includes(formData.subdomain) && formData.subdomain)) && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </button>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Use a custom address
              </p>
            </div>
            <div className="flex items-center space-x-2 ml-8">
              <input
                type="text"
                value={customMode || !subdomainOptions.includes(formData.subdomain) ? formData.subdomain : ''}
                onChange={(e) => {
                  setCustomMode(true);
                  handleCustomInput(e.target.value);
                }}
                onFocus={() => setCustomMode(true)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                placeholder="yourchurch"
                maxLength={30}
              />
              <span className="text-gray-600 dark:text-gray-400 whitespace-nowrap">
                .{process.env.REACT_APP_PROJECT_DOMAIN || '.thechurchhq.com'}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 ml-8">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
         <p onClick={handleLogout} className="text-center cursor-pointer text-base text-gray-500 dark:text-gray-400">
            Logout
        </p>
        <button
          onClick={onNext}
          disabled={!formData.subdomain}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          Continue
          <ArrowRight className="ml-2 w-5 h-5" />
        </button>
      </div>

      {/* Help */}
     
    </div>
  );
};

export default SubdomainStep;
