import { useAuth } from '../context/AuthContext';

/**
 * Feature and Limit types are dynamic strings — new features and limits
 * can be created from the super admin dashboard without code changes.
 * The runtime checks are simple object key lookups.
 */
export type Feature = string;
export type Limit = string;

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

    const planDetails = user?.merchant?.subscription?.planDetails;
    if (!planDetails) {
      return null;
    }

    // Check dynamicLimits first, then legacy limits
    const dynamicValue = planDetails?.dynamicLimits?.[limit];
    if (dynamicValue !== undefined) {
      return dynamicValue === null ? Infinity : dynamicValue;
    }

    const value = planDetails?.limits?.[limit];
    return value === null ? Infinity : (value ?? null); // null in DB means unlimited
  };

  return { hasFeature, getLimit };
};
