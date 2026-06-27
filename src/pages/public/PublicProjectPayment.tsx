import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, User, Phone, Loader2, Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { projectAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { formatCurrency } from '../../utils/currency';
import useSEO from '../../hooks/useSEO';

interface Tier {
  _id: string;
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  color?: string;
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
  };
  tiers: Tier[];
  goal: {
    targetAmount: number;
    raisedAmount: number;
    currency: string;
  };
  merchant: {
    name: string;
    logo?: string;
    email?: string;
  };
  status: string;
}

const PublicProjectPayment = () => {
  const { merchantId, id } = useParams();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedTier, setSelectedTier] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    loadProject();

    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference');

    if (reference && merchantId && id) {
      navigate(`/projects/payment/${merchantId}/${id}/status?reference=${reference}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId, id, navigate]);

  const seoConfig = project ? {
    title: `${project.name} - Make a Contribution | ${project.merchant.name}`,
    description: `Support ${project.merchant.name} by contributing to ${project.name}. Make your payment securely online.`,
    ogTitle: `${project.name} - Make a Contribution | ${project.merchant.name}`,
    ogDescription: `Support ${project.merchant.name} by contributing to ${project.name}. Make your payment securely online.`,
    ogImage: project.coverImage?.url || project.merchant.logo || '/default-og-image.png',
    ogUrl: typeof window !== 'undefined' ? window.location.href : '',
    image: project.coverImage?.url || project.merchant.logo || '/default-og-image.png',
    canonicalUrl: typeof window !== 'undefined' ? window.location.href : '',
    keywords: `project donation, ${project.name}, ${project.merchant.name}, contribute`,
  } : {
    title: 'Project Payment | The Church HQ',
    description: 'Make a secure payment for project support.',
    ogTitle: 'Project Payment | The Church HQ',
    ogDescription: 'Make a secure payment for project support.',
    ogImage: '/default-og-image.png',
    ogUrl: typeof window !== 'undefined' ? window.location.href : '',
    image: '/default-og-image.png',
    canonicalUrl: typeof window !== 'undefined' ? window.location.href : '',
    keywords: 'project donation, church payment, contribute'
  };

  useSEO(seoConfig);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getPublicProject(merchantId!, id!);
      const projectData = response.data.data.project;
      setProject(projectData);
      setEmail(projectData.merchant.email || '');
    } catch (error: any) {
      showToast.error('Failed to load project');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTier) {
      showToast.error('Please select a tier');
      return;
    }

    if (!fullName || !phone) {
      showToast.error('Please fill in all required fields');
      return;
    }

    const tier = project?.tiers.find(t => t._id === selectedTier);
    if (!tier) {
      showToast.error('Invalid tier selected');
      return;
    }

    const amount = customAmount ? parseFloat(customAmount) : tier.minimumAmount;
    if (amount < tier.minimumAmount) {
      showToast.error(`Amount must be at least ${formatCurrency(tier.minimumAmount, project!.goal.currency)}`);
      return;
    }

    try {
      setSubmitting(true);

      const initiateResponse = await projectAPI.initiateProjectPayment(
        merchantId!,
        id!,
        {
          tierId: selectedTier,
          firstName: fullName.split(' ')[0],
          lastName: fullName.split(' ').slice(1).join(' ') || '',
          phone,
          email,
          amount,
        }
      );

      if (initiateResponse.data.data.authorizationUrl) {
        window.location.href = initiateResponse.data.data.authorizationUrl;
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to initiate payment');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Project Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">The project you're looking for doesn't exist or is not available.</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const selectedTierData = project.tiers.find(t => t._id === selectedTier);
  const paymentAmount = customAmount ? parseFloat(customAmount) : selectedTierData?.minimumAmount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 sm:py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          {project.merchant.logo && (
            <img
              src={project.merchant.logo}
              alt={project.merchant.name}
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
            {project.merchant.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 text-center">Project Contribution Payment</p>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Make a Contribution</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Tier Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Contribution Tier <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {project.tiers.map((tier) => (
                  <button
                    key={tier._id}
                    type="button"
                    onClick={() => {
                      setSelectedTier(tier._id);
                      setCustomAmount('');
                    }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedTier === tier._id
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">{tier.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                          From {formatCurrency(tier.minimumAmount, project.goal.currency)}
                        </p>
                      </div>
                      {selectedTier === tier._id && (
                        <Check className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Amount */}
            {selectedTierData && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Contribution Amount (optional - minimum: {formatCurrency(selectedTierData.minimumAmount, project.goal.currency)})
                </label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder={`Enter custom amount (minimum: ${selectedTierData.minimumAmount})`}
                  min={selectedTierData.minimumAmount}
                  step="1"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            {/* Payment Summary */}
            {selectedTierData && (
              <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">Total Amount:</span>
                  <span className="text-xl font-bold text-primary-600 dark:text-primary-400">
                    {formatCurrency(paymentAmount, project.goal.currency)}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting || !selectedTier}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Continue to Payment
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicProjectPayment;
