import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { merchantAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { useAuth } from '../../context/AuthContext';
import PageTransition from '../../components/auth/PageTransition';

// Step Components
import SubdomainStep from '../../components/onboarding/SubdomainStep';
import CongregationStep from '../../components/onboarding/CongregationStep';
import BrandingStep from '../../components/onboarding/BrandingStep';
import PlanStep from '../../components/onboarding/PlanStep';
import SuccessStep from '../../components/onboarding/SuccessStep';
import ThemeToggle from '../../components/ui/ThemeToggle';

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, checkAuth } = useAuth();

  const merchantId = location.state?.merchantId || user?.merchant?.id || user?.merchant?.id || '';
  const subdomainOptions = ['gracelove','faithlove'] || location.state?.subdomainOptions || user?.merchant?.subdomainOptions || [];
//   const email = location.state?.email || user?.email || '';
  const churchName = location.state?.churchName || user?.merchant?.name || '';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

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
    plan: 'free',
    paymentMethod: 'card' as 'card' | 'mobile_money',
    cardholderName: '',
    cardNumber: '',
    expirationDate: '',
    cvc: '',
  });

  useEffect(() => {
    if (!merchantId) {
      showToast.error('Merchant information missing. Please try registering again.');
      navigate('/register');
    }
  }, [merchantId, navigate]);

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
    if (currentStep === 3) {
      // Skip branding
      setCurrentStep(currentStep + 1);
    } else if (currentStep === 4) {
      // Skip payment - auto-select free plan
      setFormData({ ...formData, plan: 'free' });
      handleSubmit(true);
    }
  };

const handleSubmit = async (skipPayment = false) => {
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

    if (!skipPayment && formData.plan !== 'free') {
      data.append('paymentMethod', formData.paymentMethod);
      data.append('cardholderName', formData.cardholderName);
    }

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
