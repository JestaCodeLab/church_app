import React from 'react';

const SpiritualJoiningFields = ({ formData, handleInputChange, showOccupation = true }) => {
  return (
    <>
      {/* Occupation & Place of Work */}
      {showOccupation && (
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Occupation
            </label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="e.g., Teacher, Engineer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Place of Work
            </label>
            <input
              type="text"
              name="placeOfWork"
              value={formData.placeOfWork || ''}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="e.g., ABC School, XYZ Company"
            />
          </div>
        </div>
      )}

      {/* Spiritual Information */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Spiritual Information
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          {/* Born Again */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Are you born again?
            </label>
            <select
              name="bornAgain"
              value={formData.bornAgain === null ? '' : String(formData.bornAgain)}
              onChange={(e) => {
                const value = e.target.value === '' ? null : e.target.value === 'true';
                handleInputChange({ target: { name: 'bornAgain', value } });
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">Select...</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          {/* Baptism Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Baptism Status
            </label>
            <select
              name="baptismStatus"
              value={formData.baptismStatus || 'none'}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="none">None</option>
              <option value="water">Water Baptism</option>
              <option value="holyGhost">Holy Ghost Baptism</option>
              <option value="both">Both</option>
            </select>
          </div>
        </div>

        {/* How Did You Join */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            How did you join Saviours Embassy?
          </label>
          <select
            name="howDidYouJoin"
            value={formData.howDidYouJoin || ''}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="">Select...</option>
            <option value="invitation">Invitation</option>
            <option value="social_media">Social Media</option>
            <option value="church_event">Church Event</option>
            <option value="walk_in">Walk-in</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Show "Other" text field if "Other" is selected */}
        {formData.howDidYouJoin === 'other' && (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Please specify how you joined
            </label>
            <input
              type="text"
              name="howDidYouJoinOther"
              value={formData.howDidYouJoinOther || ''}
              onChange={handleInputChange}
              maxLength={200}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              placeholder="Please specify..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formData.howDidYouJoinOther?.length || 0}/200 characters
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default SpiritualJoiningFields;