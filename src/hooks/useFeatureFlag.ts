import { useAuth } from '../context/AuthContext';

export type Feature = 
  // Core Features
  | 'memberManagement'
  | 'branchManagement'
  | 'departmentManagement'
  | 'eventManagement'
  | 'eventDonations'
  | 'attendanceTracking'
  | 'sermonManagement'
  | 'financialManagement'
  | 'financeDonations'
  | 'financeWallet'
  | 'expenseTracking'
  | 'incomeTracking'
  | 'tithingManagement'
  | 'financialReports'
  | 'transactionManagement'
  // Communication Features
  | 'emailCommunications'
  | 'smsCommunications'
  | 'bulkMessaging'
  | 'smsAutomation'
  | 'smsSend'
  | 'smsHistory'
  | 'smsAnalytics'
  | 'smsTemplates'
  | 'smsCredits'
  | 'smsSenderId'
  // Reporting Features
  | 'basicReports'
  | 'advancedReports'
  | 'customReports'
  | 'dataExport'
  // Integration Features
  | 'apiAccess'
  | 'webhooks'
  | 'thirdPartyIntegrations'
  // Support Features
  | 'emailSupport'
  | 'prioritySupport'
  | 'dedicatedAccountManager'
  | 'phoneSupport'
  // Customization Features
  | 'customBranding'
  | 'customDomain'
  | 'whiteLabel'
  // Advanced Features
  | 'multiLanguage'
  | 'mobileApp'
  | 'automatedWorkflows'
  // Social Media
  | 'socialMedia';

type Limit = 
  | 'members'
  | 'branches'
  | 'events'
  | 'sermons'
  | 'storage'
  | 'users'
  | 'smsCredits'
  | 'emailCredits';

interface FeatureAccess {
  hasFeature: (feature: Feature) => boolean;
  getLimit: (limit: Limit) => number | null;
}

export const useFeatureFlag = (): FeatureAccess => {
  const { user } = useAuth();

  const hasFeature = (feature: Feature): boolean => {
    // Super admin has all features
    if (user?.role?.slug === 'super_admin') {
      return true;
    }

    if (!user?.merchant?.subscription?.features) {
      return false;
    }
    
    return user.merchant.subscription.features[feature] === true;
  };

  const getLimit = (limit: Limit): number | null => {
    // Super admin has unlimited limits
    if (user?.role?.slug === 'super_admin') {
      return Infinity; // Represent unlimited as Infinity
    }

    if (!user?.merchant?.subscription?.planDetails?.limits) {
      return null;
    }

    const value = user.merchant.subscription.planDetails.limits[limit];
    return value === null ? Infinity : value; // null in DB means unlimited
  };

  return { hasFeature, getLimit };
};
