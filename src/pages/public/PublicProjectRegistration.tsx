import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Heart, User, Phone, Mail, CheckCircle2, AlertCircle, Loader2, Check } from 'lucide-react';
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

interface RegistrationFormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'phone' | 'number' | 'textarea' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: string[];
}

interface Project {
  _id: string;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
  };
  tiers: Tier[];
  registrationForm?: {
    enabled: boolean;
    fields: RegistrationFormField[];
  };
  goal: {
    targetAmount: number;
    raisedAmount: number;
    currency: string;
  };
  publicSettings?: {
    showTargetAmount: boolean;
  };
  merchant: {
    name: string;
    logo?: string;
  };
  status: string;
}

const PublicProjectRegistration = () => {
  const { merchantId, id } = useParams();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [selectedTier, setSelectedTier] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProject();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [merchantId, id]);

  const seoConfig = project ? {
    title: `${project.name} - Join Our Project | ${project.merchant.name}`,
    description: `Support ${project.merchant.name}'s ${project.name} project. Register now to contribute.`,
    ogTitle: `${project.name} - Join Our Project | ${project.merchant.name}`,
    ogDescription: `Support ${project.merchant.name}'s ${project.name} project. Register now to contribute.`,
    ogImage: project.coverImage?.url || project.merchant.logo || '/default-og-image.png',
    ogUrl: typeof window !== 'undefined' ? window.location.href : '',
    image: project.coverImage?.url || project.merchant.logo || '/default-og-image.png',
    canonicalUrl: typeof window !== 'undefined' ? window.location.href : '',
    keywords: `project registration, ${project.name}, ${project.merchant.name}, contribution`,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: project.name,
      description: project.description || `Support ${project.merchant.name}'s ${project.name} project.`,
      image: project.coverImage?.url || project.merchant.logo || '/default-og-image.png',
      organizer: {
        '@type': 'Organization',
        name: project.merchant.name,
        logo: project.merchant.logo || ''
      },
      url: typeof window !== 'undefined' ? window.location.href : '',
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode'
    }
  } : {
    title: 'Project Registration | The Church HQ',
    description: 'Register for project contribution.',
    ogTitle: 'Project Registration | The Church HQ',
    ogDescription: 'Register for project contribution.',
    ogImage: '/default-og-image.png',
    ogUrl: typeof window !== 'undefined' ? window.location.href : '',
    image: '/default-og-image.png',
    canonicalUrl: typeof window !== 'undefined' ? window.location.href : '',
    keywords: 'project registration, church project'
  };

  useSEO(seoConfig);

  const loadProject = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getPublicProject(merchantId!, id!);
      const projectData = response.data.data.project;
      setProject(projectData);

      if (projectData.registrationForm?.fields) {
        const initialFields: Record<string, string> = {};
        projectData.registrationForm.fields.forEach((field: RegistrationFormField) => {
          initialFields[field.name] = '';
        });
        setCustomFields(initialFields);
      }
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
      showToast.error('Please select a contribution tier');
      return;
    }

    try {
      setSubmitting(true);

      const nameParts = fullName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const registrationData = {
        tierId: selectedTier,
        firstName,
        lastName,
        phone,
        email: email || undefined,
        customFields: Object.keys(customFields).length > 0 ? customFields : undefined,
      };

      await projectAPI.registerPublicPartner(merchantId!, id!, registrationData);

      setSuccess(true);
      showToast.success('Registration successful! Thank you for your support.');
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Registration failed');
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  const calculateProgress = (raised: number, target: number) => {
    return Math.min((raised / target) * 100, 100);
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
          <p className="text-gray-600 dark:text-gray-400">This project is no longer available.</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Thank You!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Your registration for <strong>{project.name}</strong> has been received. Your support means everything to us!
          </p>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              You'll receive further information via the contact details you provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(project.goal.raisedAmount, project.goal.targetAmount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {project.merchant.logo && (
            <img
              src={project.merchant.logo}
              alt={project.merchant.name}
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {project.merchant.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Project Support</p>
        </div>

        {/* Project Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
          {project.coverImage?.url && (
            <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
              <img
                src={project.coverImage.url}
                alt={project.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{project.name}</h2>
            </div>

            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">{project.description}</p>
            )}

            {/* Progress Bar */}
            {project.publicSettings?.showTargetAmount !== false && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{progress.toFixed(0)}% reached</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>{formatCurrency(project.goal.raisedAmount, project.goal.currency)} raised</span>
                  <span>{formatCurrency(project.goal.targetAmount, project.goal.currency)} goal</span>
                </div>
              </div>
            )}

            {/* Tiers */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Select Your Contribution Tier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.tiers.map((tier) => (
                  <button
                    key={tier._id}
                    type="button"
                    onClick={() => setSelectedTier(tier._id)}
                    className={`text-left p-5 rounded-xl border-2 transition-all relative overflow-hidden ${
                      selectedTier === tier._id
                        ? 'shadow-lg'
                        : 'hover:shadow-md'
                    }`}
                    style={{
                      borderColor: tier.color || '#9333EA',
                      backgroundColor: selectedTier === tier._id
                        ? `${tier.color || '#9333EA'}15`
                        : `${tier.color || '#9333EA'}08`
                    }}
                  >
                    <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: tier.color || '#9333EA' }}></div>

                    {selectedTier === tier._id && (
                      <div
                        className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center shadow-md"
                        style={{ backgroundColor: tier.color || '#9333EA' }}
                      >
                        <Check className="w-4 h-4 text-white" strokeWidth={3} />
                      </div>
                    )}

                    <div className="flex items-center gap-2 mb-2 pl-2">
                      <div
                        className="w-5 h-5 rounded-full shadow-sm"
                        style={{ backgroundColor: tier.color || '#9333EA' }}
                      />
                      <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">{tier.name}</h4>
                    </div>
                    <p className="font-semibold mb-2 pl-2" style={{ color: tier.color || '#9333EA' }}>
                      {formatCurrency(tier.minimumAmount, project.goal.currency)} minimum
                    </p>
                    {tier.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 pl-2">{tier.description}</p>
                    )}
                    {tier.benefits && tier.benefits.length > 0 && (
                      <div className="pl-2">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Benefits:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          {tier.benefits.map((benefit, idx) => (
                            <li key={idx}>• {benefit}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Your Details</h3>

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
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email (optional)"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Custom Fields */}
            {project.registrationForm?.fields && project.registrationForm.fields.length > 0 && (
              <>
                {project.registrationForm.fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        required={field.required}
                        value={customFields[field.name] || ''}
                        onChange={(e) => setCustomFields({ ...customFields, [field.name]: e.target.value })}
                        placeholder={field.placeholder || ''}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      <input
                        type={field.type}
                        required={field.required}
                        value={customFields[field.name] || ''}
                        onChange={(e) => setCustomFields({ ...customFields, [field.name]: e.target.value })}
                        placeholder={field.placeholder || ''}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      />
                    )}
                  </div>
                ))}
              </>
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
                  Registering...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Register & Support
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicProjectRegistration;
