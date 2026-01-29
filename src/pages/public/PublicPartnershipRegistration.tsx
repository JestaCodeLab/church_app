import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, User, Phone, Mail, DollarSign, CheckCircle2, AlertCircle, Loader2, Check } from 'lucide-react';
import { partnershipAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { formatCurrency } from '../../utils/currency';

interface Tier {
  _id: string;
  name: string;
  minimumAmount: number;
  description?: string;
  benefits?: string[];
  color?: string;
}

interface RegistrationFormField {
  fieldName: string;
  fieldType: 'text' | 'email' | 'phone' | 'number' | 'textarea';
  isRequired: boolean;
  placeholder?: string;
}

interface Programme {
  _id: string;
  name: string;
  description?: string;
  coverImage?: {
    url: string;
  };
  tiers: Tier[];
  registrationForm?: {
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

const PublicPartnershipRegistration = () => {
  const { merchantId, programmeId } = useParams();
  const navigate = useNavigate();

  const [programme, setProgramme] = useState<Programme | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [selectedTier, setSelectedTier] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, string>>({});

  useEffect(() => {
    loadProgramme();
  }, [merchantId, programmeId]);

  const loadProgramme = async () => {
    try {
      setLoading(true);
      const response = await partnershipAPI.getPublicProgramme(merchantId!, programmeId!);
      const programmeData = response.data.data.programme;
      setProgramme(programmeData);

      // Initialize custom fields
      if (programmeData.registrationForm?.fields) {
        const initialFields: Record<string, string> = {};
        programmeData.registrationForm.fields.forEach((field: RegistrationFormField) => {
          initialFields[field.fieldName] = '';
        });
        setCustomFields(initialFields);
      }
    } catch (error: any) {
      showToast.error('Failed to load partnership programme');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTier) {
      showToast.error('Please select a partnership tier');
      return;
    }

    try {
      setSubmitting(true);

      // Split fullName into firstName and lastName
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

      await partnershipAPI.registerPublicPartner(merchantId!, programmeId!, registrationData);
      
      setSuccess(true);
      showToast.success('Registration successful! You are now a partner.');
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
          <Loader2 className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading partnership programme...</p>
        </div>
      </div>
    );
  }

  if (!programme) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Programme Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400">This partnership programme is no longer available.</p>
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
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Welcome, Partner!</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Thank you for joining <strong>{programme.name}</strong>. Your partnership makes a difference!
          </p>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-purple-900 dark:text-purple-200">
              You'll receive further information via the contact details you provided.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const progress = calculateProgress(programme.goal.raisedAmount, programme.goal.targetAmount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {programme.merchant.logo && (
            <img
              src={programme.merchant.logo}
              alt={programme.merchant.name}
              className="h-16 w-auto mx-auto mb-4"
            />
          )}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {programme.merchant.name}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">Partnership Programme</p>
        </div>

        {/* Programme Info Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden mb-8">
          {programme.coverImage?.url && (
            <div className="h-48 bg-gradient-to-r from-purple-600 to-blue-600 overflow-hidden">
              <img
                src={programme.coverImage.url}
                alt={programme.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          <div className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <Heart className="w-8 h-8 text-purple-600 dark:text-purple-400" />
              <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{programme.name}</h2>
            </div>
            
            {programme.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-6">{programme.description}</p>
            )}

            {/* Progress Bar - Only show if enabled */}
            {programme.publicSettings?.showTargetAmount !== false && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{progress.toFixed(0)}% reached</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-3 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mt-2">
                  <span>{formatCurrency(programme.goal.raisedAmount, programme.goal.currency)} raised</span>
                  <span>{formatCurrency(programme.goal.targetAmount, programme.goal.currency)} goal</span>
                </div>
              </div>
            )}

            {/* Tiers */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Select Your Partnership Tier</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programme.tiers.map((tier) => (
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
                    
                    {/* Selected Check Icon */}
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
                      {formatCurrency(tier.minimumAmount, programme.goal.currency)} minimum
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
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Partner Registration</h3>
          
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
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
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            {/* Custom Fields */}
            {programme.registrationForm?.fields && programme.registrationForm.fields.length > 0 && (
              <>
                {programme.registrationForm.fields.map((field) => (
                  <div key={field.fieldName}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field.fieldName} {field.isRequired && <span className="text-red-500">*</span>}
                    </label>
                    {field.fieldType === 'textarea' ? (
                      <textarea
                        required={field.isRequired}
                        value={customFields[field.fieldName] || ''}
                        onChange={(e) => setCustomFields({ ...customFields, [field.fieldName]: e.target.value })}
                        placeholder={field.placeholder || ''}
                        rows={4}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
                      />
                    ) : (
                      <input
                        type={field.fieldType}
                        required={field.isRequired}
                        value={customFields[field.fieldName] || ''}
                        onChange={(e) => setCustomFields({ ...customFields, [field.fieldName]: e.target.value })}
                        placeholder={field.placeholder || ''}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 dark:text-gray-100"
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
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Heart className="w-5 h-5 mr-2" />
                  Become a Partner
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PublicPartnershipRegistration;
