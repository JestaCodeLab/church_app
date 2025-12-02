import { useAuth } from '../context/AuthContext';

type Feature = 
  | 'memberManagement'
  | 'branchManagement'
  | 'eventManagement'
  | 'sermonManagement'
  | 'financialManagement'
  | 'donationTracking'
  | 'emailCommunications'
  | 'smsCommunications'
  | 'bulkMessaging'
  | 'basicReports'
  | 'advancedReports'
  | 'customReports'
  | 'dataExport'
  | 'apiAccess'
  | 'webhooks'
  | 'thirdPartyIntegrations'
  | 'emailSupport'
  | 'prioritySupport'
  | 'dedicatedAccountManager'
  | 'phoneSupport'
  | 'customBranding'
  | 'customDomain'
  | 'whiteLabel'
  | 'multiLanguage'
  | 'mobileApp'
  | 'automatedWorkflows';

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
    if (user?.role === 'super_admin') {
      return true;
    }

    if (!user?.merchant?.subscription?.features) {
      return false;
    }
    
    return user.merchant.subscription.features[feature] === true;
  };

  const getLimit = (limit: Limit): number | null => {
    // Super admin has unlimited limits
    if (user?.role === 'super_admin') {
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
