import { Feature } from '../hooks/useFeatureFlag';
import { merchantAPI } from '../services/api';
import { showToast } from './toasts';

export type FeatureType = Feature

interface PlanFeatures {
  [key: string]: boolean;
}

interface FeatureAccessResponse {
  success: boolean;
  data: {
    features: PlanFeatures;
  };
}

/**
 * Check if user has access to a specific feature
 * @param feature - The feature to check access for
 * @param options - Optional configuration for error handling and redirection
 * @returns Promise<boolean> - true if user has access, false otherwise
 */
export const checkFeatureAccess = async (
  feature: Feature,
  options?: {
    showErrorToast?: boolean;
    redirectUrl?: string;
    redirectDelay?: number;
    customErrorMessage?: string;
  }
): Promise<boolean> => {
  const {
    showErrorToast = true,
    redirectUrl = null,
    redirectDelay = 2000,
    customErrorMessage = null
  } = options || {};

  try {
    const response = await merchantAPI.planFeatures();
    if (!response?.data?.success) {
      if (showErrorToast) {
        showToast.error('Unable to verify feature access');
      }
      if (redirectUrl) {
        setTimeout(() => window.location.href = redirectUrl, redirectDelay);
      }
      return false;
    }

    const data: FeatureAccessResponse = response.data;
    const hasAccess = data.data?.features?.[feature] || false;

    if (!hasAccess && showErrorToast) {
      const message = customErrorMessage || 
        `${feature} is not available on your plan. Please upgrade to access this feature.`;
      showToast.error(message);
    }

    if (!hasAccess && redirectUrl) {
      setTimeout(() => window.location.href = redirectUrl, redirectDelay);
    }

    return hasAccess;
  } catch (error) {
    console.error(`Failed to check ${feature} access:`, error);
    if (showErrorToast) {
      showToast.error('Unable to verify feature access');
    }
    if (redirectUrl) {
      setTimeout(() => window.location.href = redirectUrl, redirectDelay);
    }
    return false;
  }
};

/**
 * Check multiple features at once
 * @param features - Array of features to check
 * @returns Promise with object mapping features to their access status
 */
export const checkMultipleFeaturesAccess = async (
  features: FeatureType[]
): Promise<Record<FeatureType, boolean>> => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';
    const response = await fetch(`${apiUrl}/merchants/plan-features`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    });

    if (!response.ok) {
      return features.reduce((acc, feature) => {
        acc[feature] = false;
        return acc;
      }, {} as Record<FeatureType, boolean>);
    }

    const data: FeatureAccessResponse = await response.json();
    const planFeatures = data.data?.features || {};

    return features.reduce((acc, feature) => {
      acc[feature] = planFeatures[feature] || false;
      return acc;
    }, {} as Record<FeatureType, boolean>);
  } catch (error) {
    console.error('Failed to check multiple features access:', error);
    return features.reduce((acc, feature) => {
      acc[feature] = false;
      return acc;
    }, {} as Record<FeatureType, boolean>);
  }
};
