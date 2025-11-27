import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { merchantAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { ArrowRight, ArrowLeft, Check } from 'lucide-react';
import AuthLayout from '../../components/auth/AuthLayout';
import PageTransition from '../../components/auth/PageTransition';

// Step Components
import SubdomainStep from '../../components/onboarding/SubdomainStep';
import BrandingStep from '../../components/onboarding/BrandingStep';
import PlanStep from '../../components/onboarding/PlanStep';
import SuccessStep from '../../components/onboarding/SuccessStep';

const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const merchantId = location.state?.merchantId || '';
  const subdomainOptions = location.state?.subdomainOptions || [];
  const email = location.state?.email || '';
  const churchName = location.state?.churchName || '';

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data for all steps
  const [formData, setFormData] = useState({
    subdomain: '',
    logo: null as File | null,
    logoPreview: '',
    primaryColor: '#4F46E5',
    secondaryColor: '#10B981',
    tagline: '',
    expectedMemberCount: '',
    plan: 'free',
  });

  // Redirect if no merchant ID
  useEffect(() => {
    if (!merchantId) {
      showToast.error('Please complete registration first');
      navigate('/register');
    }
  }, [merchantId, navigate]);

  const steps = [
    { number: 1, title: 'Choose Subdomain', component: SubdomainStep },
    { number: 2, title: 'Brand Your Church', component: BrandingStep },
    { number: 3, title: 'Select Plan', component: PlanStep },
    { number: 4, title: 'Success', component: SuccessStep },
  ];

  const handleNext = async () => {
    // Validate current step
    if (currentStep === 1 && !formData.subdomain) {
      showToast.error('Please select a subdomain');
      return;
    }

    if (currentStep === 2 && !formData.tagline) {
      showToast.error('Please enter a tagline for your church');
      return;
    }

    if (currentStep === 3 && !formData.expectedMemberCount) {
      showToast.error('Please enter expected member count');
      return;
    }

    // If last step, submit to backend
    if (currentStep === 3) {
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

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Create FormData for file upload
      const data = new FormData();
      data.append('subdomain', formData.subdomain);
      data.append('primaryColor', formData.primaryColor);
      data.append('secondaryColor', formData.secondaryColor);
      data.append('tagline', formData.tagline);
      data.append('expectedMemberCount', formData.expectedMemberCount);
      data.append('plan', formData.plan);

      if (formData.logo) {
        data.append('logo', formData.logo);
      }

      await merchantAPI.completeOnboarding(data);

      showToast.success('Onboarding completed successfully!');
      setCurrentStep(4); // Success step
    } catch (error: any) {
      showToast.error(
        error?.response?.data?.message || 'Failed to complete onboarding'
      );
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepComponent = steps[currentStep - 1].component;

  return (
    <PageTransition direction="right">
      <AuthLayout 
        title={currentStep === 4 ? '🎉 Welcome!' : 'Complete Your Setup'}
        subtitle={currentStep === 4 ? 'Your church is ready to go!' : `Step ${currentStep} of 3`}
        maxWidth="2xl"
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors">
          {/* Progress Bar */}
          {currentStep < 4 && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-2">
                {steps.slice(0, 3).map((step) => (
                  <div
                    key={step.number}
                    className={`flex items-center ${
                      step.number < steps.length ? 'flex-1' : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${
                        step.number < currentStep
                          ? 'bg-primary-600 text-white'
                          : step.number === currentStep
                          ? 'bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {step.number < currentStep ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        step.number
                      )}
                    </div>
                    {step.number < 3 && (
                      <div
                        className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                          step.number < currentStep
                            ? 'bg-primary-600'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-2">
                <span>Subdomain</span>
                <span>Branding</span>
                <span>Plan</span>
              </div>
            </div>
          )}

          {/* Current Step Content */}
          <CurrentStepComponent
            formData={formData}
            setFormData={setFormData}
            subdomainOptions={subdomainOptions}
            // churchName={'churchName'}
            // email={email}
          />

          {/* Navigation Buttons */}
          {currentStep < 4 && (
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </button>

              <button
                onClick={handleNext}
                disabled={loading}
                className="px-6 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {loading ? (
                  'Saving...'
                ) : currentStep === 3 ? (
                  <>
                    Complete Setup
                    <Check className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </AuthLayout>
    </PageTransition>
  );
};

export default Onboarding;
