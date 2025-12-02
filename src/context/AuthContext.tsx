import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

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
  role: string;
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
      planDetails: Plan; // Add planDetails here
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
        setUser(response.data.data.user);
        setIsAuthenticated(true);
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

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;