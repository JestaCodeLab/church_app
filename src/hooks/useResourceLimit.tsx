import { useAuth } from '../context/AuthContext';

export type ResourceType = 'members' | 'branches' | 'events' | 'sermons' | 'users' | 'departments';

interface ResourceLimitResult {
  canCreate: boolean;
  current: number;
  limit: number | null;
  isUnlimited: boolean;
  percentageUsed: number;
  remaining: number;
  isNearLimit: boolean;
}

export const useResourceLimit = (resourceType: ResourceType): ResourceLimitResult => {
  const { user } = useAuth();

  // Super admin has unlimited access
  if (user?.role?.slug === 'super_admin') {
    return {
      canCreate: true,
      current: 0,
      limit: null,
      isUnlimited: true,
      percentageUsed: 0,
      remaining: Infinity,
      isNearLimit: false,
    };
  }

  const subscription = user?.merchant?.subscription;
  
  if (!subscription) {
    return {
      canCreate: false,
      current: 0,
      limit: 0,
      isUnlimited: false,
      percentageUsed: 100,
      remaining: 0,
      isNearLimit: true,
    };
  }

  // Get current usage and limit
  const current = subscription?.usage?.[resourceType] || 0;
  const limit = subscription?.limits?.[resourceType];

  // null or undefined limit means unlimited
  const isUnlimited = limit === null || limit === undefined;

  if (isUnlimited) {
    return {
      canCreate: true,
      current,
      limit: null,
      isUnlimited: true,
      percentageUsed: 0,
      remaining: Infinity,
      isNearLimit: false,
    };
  }

  // Calculate usage
  const remaining = Math.max(0, limit - current);
  const percentageUsed = limit > 0 ? Math.round((current / limit) * 100) : 0;
  const isNearLimit = percentageUsed >= 60;
  const canCreate = current < limit;

  return {
    canCreate,
    current,
    limit,
    isUnlimited,
    percentageUsed,
    remaining,
    isNearLimit,
  };
};