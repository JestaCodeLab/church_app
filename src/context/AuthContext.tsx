import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, settingsAPI } from '../services/api';
import useSessionExpiry from '../hooks/useSessionExpiry';
import SessionExpiryModal from '../components/modals/SessionExpiryModal';

interface Role {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  type: 'system' | 'custom';
  level: number;
  permissions: {
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
    const token = localStorage.getItem('accessToken');
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
    logout();
  } finally {
    setLoading(false);
  }
};

  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    try {
      const response = await authAPI.login(credentials);
      const { user, accessToken, refreshToken } = response.data.data;

      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));

      setUser(user);
      setIsAuthenticated(true);

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
      return {
        success: false,
        message: error?.response?.data?.message || 'Login failed. Please try again.',
      };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
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