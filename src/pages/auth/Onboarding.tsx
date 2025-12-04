import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { merchantAPI, settingsAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { useAuth } from '../../context/AuthContext';
import PageTransition from '../../components/auth/PageTransition';
import { authAPI } from '../../services/api';

// Step Components
import SubdomainStep from '../../components/onboarding/SubdomainStep';
import CongregationStep from '../../components/onboarding/CongregationStep';
import BrandingStep from '../../components/onboarding/BrandingStep';
import PlanStep from '../../components/onboarding/PlanStep';
import SuccessStep from '../../components/onboarding/SuccessStep';
import ThemeToggle from '../../components/ui/ThemeToggle';
import toast from 'react-hot-toast';

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuth();

  console.log('User', user)

  const merchantId = location.state?.merchantId || user?.merchant?.id || user?.merchant?.id || '';
  const subdomainOptions = location.state?.subdomainOptions || user?.merchant?.subdomainOptions || [];
  const churchName = location.state?.churchName || user?.merchant?.name || '';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [availablePlans, setAvailablePlans] = useState([]);

  const [formData, setFormData] = useState({
    churchName: churchName || '',
    tagline: '',
    subdomain: '',
    congregationSize: '',
    congregationSizeRange: '',
    logo: null as File | null,
    logoPreview: '',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    plan: 'starter', // Default to starter
  });

  useEffect(() => {
    if (!merchantId) {
      showToast.error('Merchant information missing. Please try registering again.');
      navigate('/register');
    }
    fetchAvailablePlans();
  }, [merchantId, navigate]);

  const fetchAvailablePlans = async () => {
    try {
      const response = await settingsAPI.getSubscription();
      // Sort available plans by price for consistent display
      const sortedPlans = response.data.data.availablePlans.sort((a: any, b: any) => a.price.amount - b.price.amount);
      setAvailablePlans(sortedPlans);
    } catch (error) {
      console.error("Failed to fetch available plans:", error);
      showToast.error("Failed to load plans for onboarding.");
    }
  };

  const handleLogout = () => {
  // Clear tokens
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Show message
  toast.success('Progress saved! You can continue later.');
  
  // Redirect to login
  navigate('/login');
};

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 1 && !formData.subdomain) {
      showToast.error('Please select or enter a subdomain');
      return;
    }

    if (currentStep === 2 && !formData.congregationSize && !formData.congregationSizeRange) {
      showToast.error('Please select your congregation size');
      return;
    }

    // If last step (Plan), submit to backend
    if (currentStep === 4) {
      await handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    // Skip branding or plan selection directly to next step
    setCurrentStep(currentStep + 1);
  };

const handleSubmit = async () => { // Removed skipPayment parameter
  setLoading(true);

  try {
    // Create FormData for file upload
    const data = new FormData();
    data.append('subdomain', formData.subdomain);
    data.append('tagline', formData.tagline);
    data.append('congregationSize', formData.congregationSize || formData.congregationSizeRange);
    data.append('primaryColor', formData.primaryColor);
    data.append('secondaryColor', formData.secondaryColor);
    data.append('plan', formData.plan);

    // Append logo file if exists
    if (formData.logo) {
      data.append('logo', formData.logo);
    }

    // Payment details are handled by PlanStep before this handleSubmit is called

    await merchantAPI.completeOnboarding(data);
    await checkAuth();

    showToast.success('Setup completed successfully! 🎉');
    setCurrentStep(5);
  } catch (error: any) {
    showToast.error(
      error?.response?.data?.message || 'Failed to complete setup'
    );
  } finally {
    setLoading(false);
  }
};

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SubdomainStep
            formData={formData}
            setFormData={setFormData}
            subdomainOptions={subdomainOptions}
            churchName={churchName}
            onNext={handleNext}
            onBack={handleBack}
            handleLogout={handleLogout}
          />
        );
      case 2:
        return (
          <CongregationStep
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case 3:
        return (
          <BrandingStep
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
          />
        );
      case 4:
        return (
          <PlanStep
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
            onSkip={handleSkip}
            loading={loading}
            availablePlans={availablePlans} // Pass available plans
          />
        );
      case 5:
        return (
          <SuccessStep
            churchName={formData.churchName}
            subdomain={formData.subdomain}
            onContinue={() => navigate('/dashboard')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageTransition direction="right">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors">
        <div className="fixed top-4 right-4 z-50">
            <ThemeToggle />
        </div>
        <div className="max-w-2xl w-full">
          {renderStep()}
        </div>
      </div>
    </PageTransition>
  );
};

export default Onboarding;
