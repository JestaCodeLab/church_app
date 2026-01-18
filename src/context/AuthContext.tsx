import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, settingsAPI } from '../services/api';
import useSessionExpiry from '../hooks/useSessionExpiry';
import SessionExpiryModal from '../components/modals/SessionExpiryModal';
import { setSecureItem, getSecureItem } from '../utils/encryption';

interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'system' | 'custom';
  level: number;
  // New architecture: Array of permission references (populated from Permission model)
  permissions: Array<{
    permissionId: {
      _id: string;
      category: string;
      action: string;
      displayName: string;
      description?: string;
      isActive: boolean;
    };
    assignedAt: string;
    assignedBy?: string;
  }> | {
    // Fallback for legacy boolean-based permissions structure
    members?: Record<string, boolean>;
    departments?: Record<string, boolean>;
    branches?: Record<string, boolean>;
    events?: Record<string, boolean>;
    finance?: Record<string, boolean>;
    sermons?: Record<string, boolean>;
    communications?: Record<string, boolean>;
    reports?: Record<string, boolean>;
    users?: Record<string, boolean>;
    settings?: Record<string, boolean>;
  };
  isActive: boolean;
}

interface Plan {
  _id: string;
  name: string;
  slug: string;
  price: {
    amount: number;
    currency: string;
  };
  limits: {
    members: number | null;
    branches: number | null;
    events: number | null;
    sermons: number | null;
    storage: number | null;
    users: number | null;
    smsCredits: number;
    emailCredits: number;
  };
  features: {
    memberManagement: boolean;
    branchManagement: boolean;
    eventManagement: boolean;
    sermonManagement: boolean;
    financialManagement: boolean;
    donationTracking: boolean;
    emailCommunications: boolean;
    smsCommunications: boolean;
    bulkMessaging: boolean;
    basicReports: boolean;
    advancedReports: boolean;
    customReports: boolean;
    dataExport: boolean;
    apiAccess: boolean;
    webhooks: boolean;
    thirdPartyIntegrations: boolean;
    emailSupport: boolean;
    prioritySupport: boolean;
    dedicatedAccountManager: boolean;
    phoneSupport: boolean;
    customBranding: boolean;
    customDomain: boolean;
    whiteLabel: boolean;
    multiLanguage: boolean;
    mobileApp: boolean;
    automatedWorkflows: boolean;
  };
  isPublic: boolean;
  isActive: boolean;
  type: string;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  photo?: string | null;
  phone?: string | null;
  merchant?: {
    id: string;
    name: string;
    subdomain: string;
    status: string;
    emailVerified: boolean;
    onboardingCompleted: boolean;
    subdomainOptions: string[];
    branding: {
      logo: string | null;
      logoPublicId: string | null;
      primaryColor: string;
      secondaryColor: string;
      tagline: string;
    };
    subscription: {
      plan: string;
      status: string;
      startDate: string;
      endDate?: string;
      memberLimit: number;
      currentMemberCount: number;
      expectedMemberCount: number;
      paymentMethod?: string;
      nextBillingDate?: string;
      currentPeriodEnd?: string;
      currentPeriodStart?: string;
      features: {
        financials: boolean;
        events: boolean;
        communications: boolean;
        reports: boolean;
      };
      planDetails: Plan;
      usage: any;
      limits: any;
    };
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<LoginResult>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  fetchAndUpdateSubscription: () => Promise<void>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResult {
  success: boolean;
  user?: User;
  requiresOnboarding?: boolean;
  message?: string;
  statusCode?: number;
  redirectUrl?: string;
  correctSubdomain?: string;
  pendingApproval?: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [extendingSession, setExtendingSession] = useState(false);

  // ADD: Function to fetch and update subscription data
  const fetchAndUpdateSubscription = useCallback(async () => {
    try {
      const response = await settingsAPI.getSubscription();
      const subscriptionData = response.data.data.subscription;
      
      // Update user state with subscription data
      setUser(prevUser => {
        if (!prevUser || !prevUser.merchant) return prevUser;
        
        return {
          ...prevUser,
          merchant: {
            ...prevUser.merchant,
            subscription: {
              ...prevUser.merchant.subscription,
              usage: subscriptionData.usage,
              limits: subscriptionData.limits,
              planDetails: subscriptionData.planDetails
            }
          }
        };
      });
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    }
  }, []);

  // Session expiry management
  const {
    timeUntilExpiry,
    isWarningActive,
    extendSession,
  } = useSessionExpiry({
    warningTimeBeforeExpiry: 5 * 60 * 1000, // 5 minutes
    onWarning: () => {
      console.log('⚠️ Session expiring soon!');
    },
    onExpired: () => {
      console.log('❌ Session expired - logging out');
      handleSessionExpired();
    },
  });

  // Check if user is logged in on mount
  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line
  }, []);

  const checkAuth = async () => {
    try {
      // ✅ Try to get encrypted access token
      const token = await getSecureItem('accessToken');
      
      if (token) {
        const response = await authAPI.getCurrentUser();
        const userData = response.data.data.user;
        
        setUser(userData);
        setIsAuthenticated(true);
        
        // ADD: Fetch subscription data if user has a merchant
        if (userData.merchant) {
          await fetchAndUpdateSubscription();
        }
      }
      
    } catch (error) {
      console.error('Auth check failed:', error);
      await logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      const response = await authAPI.login(credentials);
      
      // ✅ Handle 202 Accepted response (cross-domain redirect)
      if (response.status === 202) {
        const { redirectUrl, statusCode } = response.data;
        console.log('✅ 202 redirect response received:', redirectUrl);
        return {
          success: true,
          statusCode: 202,
          redirectUrl,
          message: 'Redirecting to your church subdomain...'
        };
      }
      
      const { user, accessToken, refreshToken } = response.data.data;

      // ✅ Store tokens securely using encrypted storage
      await setSecureItem('accessToken', accessToken);
      await setSecureItem('refreshToken', refreshToken);
      await setSecureItem('user', user);

      setUser(user);
      setIsAuthenticated(true);

      // ✅ CRITICAL: Fetch full user data with populated permissions
      // Login response might not include fully populated role.permissions
      try {
        const fullUserResponse = await authAPI.getCurrentUser();
        const fullUser = fullUserResponse.data.data.user;
        setUser(fullUser);
        await setSecureItem('user', fullUser);
      } catch (error) {
        console.warn('Could not fetch full user data after login:', error);
        // Continue anyway, user data from login should be usable
      }

      // ADD: Fetch subscription data after login
      if (user.merchant) {
        await fetchAndUpdateSubscription();
      }

      return { 
        success: true, 
        user, 
        requiresOnboarding: response.data.data.requiresOnboarding 
      };
    } catch (error: any) {
      console.error('Login failed:', error);
      const statusCode = error?.response?.status;
      const errorData = error?.response?.data;
      
      return {
        success: false,
        message: errorData?.message || 'Login failed. Please try again.',
        statusCode,
        correctSubdomain: errorData?.correctSubdomain,
        pendingApproval: errorData?.pendingApproval,
        requiresOnboarding: errorData?.requiresOnboarding,
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ✅ Remove secure items from encrypted storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Handle session expiry - auto logout user
   */
  const handleSessionExpired = useCallback(async () => {
    await logout();
    // Optionally show a toast notification
    // showToast.error('Your session has expired. Please log in again.');
  }, []);

  /**
   * Handle "Stay Logged In" button click
   */
  const handleStayLoggedIn = async () => {
    try {
      setExtendingSession(true);
      await extendSession();
      console.log('✅ Session extended successfully');
    } catch (error) {
      console.error('Failed to extend session:', error);
      await logout();
    } finally {
      setExtendingSession(false);
    }
  };

  /**
   * Handle "Sign Out" button click from modal
   */
  const handleSignOut = async () => {
    await logout();
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    fetchAndUpdateSubscription
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      
      {/* Session Expiry Modal - Only show when authenticated and warning is active */}
      {isAuthenticated && (
        <SessionExpiryModal
          isOpen={isWarningActive}
          timeRemaining={timeUntilExpiry}
          onStayLoggedIn={handleStayLoggedIn}
          onSignOut={handleSignOut}
          loading={extendingSession}
        />
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;