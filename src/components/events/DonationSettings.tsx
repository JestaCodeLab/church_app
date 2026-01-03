import React from 'react';
import { DollarSign, Link as LinkIcon, Copy, Check } from 'lucide-react';

interface DonationData {
  enabled: boolean;
  goal?: {
    amount: number;
    currency: string;
  };
  allowAnonymous: boolean;
  description: string;
  publicUrl?: string;
  thankYouSms?: string;
}

interface Props {
  value: DonationData;
  onChange: (value: DonationData) => void;
}

const DonationSettings: React.FC<Props> = ({ value, onChange }) => {
  const [copied, setCopied] = React.useState(false);

  const copyDonationLink = () => {
    if (value.publicUrl) {
      const fullUrl = `${window.location.origin}${value.publicUrl}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center space-x-3">
          <DollarSign className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white">Event Donations</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Allow people to contribute to this event
            </p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
        </label>
      </div>

      {value.enabled && (
        <div className="space-y-4">
          {/* Donation Goal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Fundraising Goal (Optional)
            </label>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={value.goal?.amount || ''}
                  onChange={(e) => onChange({
                    ...value,
                    goal: {
                      amount: parseFloat(e.target.value) || 0,
                      currency: value.goal?.currency || 'GHS'
                    }
                  })}
                  placeholder="Enter amount"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                />
              </div>
              <select
                value={value.goal?.currency || 'GHS'}
                onChange={(e) => onChange({
                  ...value,
                  goal: {
                    amount: value.goal?.amount || 0,
                    currency: e.target.value
                  }
                })}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
              >
                <option value="GHS">GHS</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Leave empty if you don't want to set a goal
            </p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Donation Description
            </label>
            <textarea
              value={value.description}
              onChange={(e) => onChange({ ...value, description: e.target.value })}
              placeholder="Explain what donations will be used for..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Thank You SMS */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Thank You SMS Message
            </label>
            <textarea
              value={value.thankYouSms || ''}
              onChange={(e) => onChange({ ...value, thankYouSms: e.target.value })}
              placeholder="Message sent to donors after successful payment (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              This SMS will be automatically sent to donors after their payment is confirmed
            </p>
          </div>

          {/* Allow Anonymous */}
          <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <input
              type="checkbox"
              id="allow-anonymous"
              checked={value.allowAnonymous}
              onChange={(e) => onChange({ ...value, allowAnonymous: e.target.checked })}
              className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label htmlFor="allow-anonymous" className="text-sm text-gray-700 dark:text-gray-300">
              Allow anonymous donations
            </label>
          </div>

          {/* Public Link (shown after event is created) */}
          {value.publicUrl && (
            <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <LinkIcon className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-900 dark:text-green-100">
                  Public Donation Link
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}${value.publicUrl}`}
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700 rounded-md text-gray-700 dark:text-gray-300"
                />
                <button
                  type="button"
                  onClick={copyDonationLink}
                  className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center space-x-2"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span className="text-sm">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="mt-2 text-xs text-green-700 dark:text-green-300">
                Share this link to allow donations from anyone. It will also be included in automated SMS.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DonationSettings;
