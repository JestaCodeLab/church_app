import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import { usePaystackSMS } from '../../../hooks/usePaystackSMS';
import { checkFeatureAccess } from '../../../utils/featureAccess';
import { 
  CreditCard, 
  TrendingUp, 
  Package, 
  CheckCircle, 
  XCircle,
  Clock,
  RefreshCw,
  Sparkles,
  Zap,
  Award,
  Wallet,
  X
} from 'lucide-react';
import { showToast } from '../../../utils/toasts';
import FeatureGate from '../../../components/access/FeatureGate';

interface Credits {
  balance: number;
  planCredits: number;
  purchasedCredits: number;
  totalAdded: number;
  totalUsed: number;
  lastPurchase?: {
    amount: number;
    date: string;
  };
}

interface CreditPackage {
  id: string;
  _id: string;
  name: string;
  slug: string;
  credits: number;
  price: number;
  currency: string;
  pricePerSMS: string;
  discount: number;
  discountedPrice: number;
  description?: string;
  features?: string[];
  isPrimary: boolean;
}

interface Purchase {
  _id: string;
  package: {
    name: string;
    credits: number;
    price: {
      amount: number;
      currency: string;
    };
  };
  payment: {
    status: string;
    method: string;
    paidAt?: string;
  };
  status: string;
  creditsAdded: boolean;
  createdAt: string;
  purchasedBy: {
    firstName: string;
    lastName: string;
  };
}

const MessagingCredits: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { initializePayment } =   usePaystackSMS();
  const [credits, setCredits] = useState<Credits | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'buy' | 'history'>('buy');
  const [hasSMSAccess, setHasSMSAccess] = useState<boolean | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [pendingPackage, setPendingPackage] = useState<CreditPackage | null>(null);

  useEffect(() => {
    checkSMSAccess();
    fetchData();
    
    // Check for payment verification (fallback for redirect method)
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  const checkSMSAccess = async () => {
    const hasAccess = await checkFeatureAccess('smsCredits', {
      showErrorToast: false
    });
    setHasSMSAccess(hasAccess);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [creditsRes, packagesRes, purchasesRes, walletRes] = await Promise.all([
        api.get('/sms/credits'),
        api.get('/sms/credit-packages'),
        api.get('/sms/purchase-history?limit=10'),
        api.get('/wallet/balance')
      ]);

      setCredits(creditsRes.data.data.credits);
      setPackages(packagesRes.data.data.packages);
      setPurchases(purchasesRes.data.data.purchases);
      setWalletBalance(walletRes.data.data.availableBalance || 0);
    } catch (error: any) {
      showToast.error('Failed to load credits data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await api.get(`/sms/verify-purchase/${reference}`);
      
      if (response.data.success) {
        showToast.success(response.data.message);
        fetchData();
        navigate('/messaging/credits', { replace: true });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Payment verification failed';
      showToast.error(errorMsg);
    }
  };

const handlePurchase = async (pkg: CreditPackage) => {
    setPendingPackage(pkg);
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = async (method: 'wallet' | 'paystack') => {
    if (!pendingPackage) return;
    
    setShowPaymentMethodModal(false);
    setPurchasing(true);
    setSelectedPackage(pendingPackage.slug);

    if (method === 'wallet') {
      handleWalletPurchase(pendingPackage);
    } else {
      handlePaystackPurchase(pendingPackage);
    }
  };

  const handleWalletPurchase = async (pkg: CreditPackage) => {
    try {
      const response = await api.post('/wallet/purchase-sms-credits', {
        packageId: pkg?.id || pkg?._id,
        credits: pkg.credits,
        amount: pkg.price
      });

      if (response.data.success) {
        showToast.success(response.data.message);
        await fetchData();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to purchase with wallet';
      showToast.error(errorMsg);
    } finally {
      setPurchasing(false);
      setSelectedPackage(null);
      setPendingPackage(null);
    }
  };

  const handlePaystackPurchase = async (pkg: CreditPackage) => {
    try {
      // Initialize purchase on backend
      const response = await api.post('/sms/purchase-credits', {
        packageId: pkg?.id || pkg?._id,
        paymentMethod: 'paystack'
      });

      if (response.data.success) {
        const { reference, amount, email } = response.data.data;
        
        // ✅ Use SMS-specific PayStack hook
        initializePayment({
          reference, // ✅ Pass pre-generated reference
          email,
          amount,
          metadata: {
            purchaseType: 'sms_credits', // ✅ Explicitly mark type
            packageName: pkg.name,
            credits: pkg.credits,
            custom_fields: [
              {
                display_name: "Package",
                variable_name: "package_name",
                value: pkg.name
              },
              {
                display_name: "Credits",
                variable_name: "credits",
                value: pkg.credits.toString()
              },
              {
                display_name: "Type",
                variable_name: "purchase_type",
                value: "sms_credits"
              }
            ]
          },
          onSuccess: (paymentReference) => {
            // ✅ Now verify SMS purchase (not subscription)
            handlePaymentSuccess(paymentReference);
          },
          onClose: () => {
            showToast.error('Payment cancelled');
            setPurchasing(false);
            setSelectedPackage(null);
          }
        });
      } else {
        showToast.error('Failed to initiate payment');
        setPurchasing(false);
        setSelectedPackage(null);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to initiate purchase';
      showToast.error(errorMsg);
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      showToast.loading('Verifying payment...');

      // ✅ This ONLY adds SMS credits, doesn't touch subscription
      const response = await api.get(`/sms/verify-purchase/${reference}`);

      if (response.data.success) {
        showToast.success(response.data.message);

        // Refresh data
        await fetchData();

        // Reset state
        setPurchasing(false);
        setSelectedPackage(null);
      }
    } catch (error: any) {
      showToast.error('Payment verification failed');
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const getPackageGradient = (index: number) => {
    const gradients = [
      'from-blue-500 to-blue-600',
      'from-purple-500 to-purple-600',
      'from-orange-500 to-orange-600',
      'from-green-500 to-green-600'
    ];
    return gradients[index % gradients.length];
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; bg: string; text: string; label: string }> = {
      completed: { 
        icon: CheckCircle,
        bg: 'bg-green-100 dark:bg-green-900/20', 
        text: 'text-green-800 dark:text-green-400',
        label: 'Completed'
      },
      pending: { 
        icon: Clock,
        bg: 'bg-yellow-100 dark:bg-yellow-900/20', 
        text: 'text-yellow-800 dark:text-yellow-400',
        label: 'Pending'
      },
      failed: { 
        icon: XCircle,
        bg: 'bg-red-100 dark:bg-red-900/20', 
        text: 'text-red-800 dark:text-red-400',
        label: 'Failed'
      }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${badge.bg} ${badge.text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <FeatureGate feature="smsCredits" showUpgrade={!hasSMSAccess}>
      <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            SMS Credits
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Purchase and manage your messaging credits
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => fetchData()}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            title="Refresh data"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Balance Cards */}
      {credits && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Balance */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div className="text-right">
                <p className="text-sm text-primary-100">Total Balance</p>
                <p className="text-3xl font-bold">{credits.balance.toLocaleString()}</p>
                <p className="text-xs text-primary-100 mt-1">SMS Credits</p>
              </div>
            </div>
            <div className="pt-4 border-t border-blue-500/30">
              <div className="flex justify-between text-sm">
                <span className="text-primary-100">Plan Credits:</span>
                <span className="font-medium">{credits.planCredits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-primary-100">Purchased:</span>
                <span className="font-medium">{credits.purchasedCredits.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Total Added */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Added</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {credits.totalAdded.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
              </div>
            </div>
          </div>

          {/* Total Used */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Used</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {credits.totalUsed.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All time</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('buy')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'buy'
                ? 'border-blue-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            Buy Credits
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            Purchase History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'buy' ? (
        <>
          {/* Credit Packages - 3 Column Grid */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Choose Your Package
            </h2>
            
            {packages.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No packages available
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Contact support to set up SMS credit packages
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {packages.map((pkg, index) => (
                  <div
                    key={pkg._id}
                    className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 ${
                      pkg.isPrimary ? 'ring-2 ring-blue-500 scale-105' : ''
                    }`}
                  >
                    {/* Header with Gradient */}
                    <div className={`bg-gradient-to-r ${getPackageGradient(index)} p-6 text-white`}>
                      {/* Badges Row */}
                      <div className="flex items-center justify-between mb-4">
                        {pkg.isPrimary && (
                          <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium">
                            <Award className="w-3 h-3 mr-1" />
                            RECOMMENDED
                          </div>
                        )}
                        {pkg.discount > 0 && (
                          <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium ml-auto">
                            <Sparkles className="w-3 h-3 mr-1" />
                            SAVE {pkg.discount}%
                          </div>
                        )}
                      </div>

                      {/* Package Name */}
                      <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                      
                      {/* Credits */}
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold">{pkg.credits.toLocaleString()}</span>
                        <span className="ml-2 text-lg opacity-90">credits</span>
                      </div>
                    </div>

                    {/* Body */}
                    <div className="p-6">
                      {/* Price Section */}
                      <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Price</p>
                            <div className="flex items-baseline">
                              <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {pkg.currency} {pkg.price}
                              </span>
                            </div>
                          </div>
                          {/* <div className="text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Price per SMS</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {pkg.currency} {pkg.pricePerSMS}
                            </p>
                          </div> */}
                        </div>
                      </div>

                      {/* Description */}
                      {pkg.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                          {pkg.description}
                        </p>
                      )}

                      {/* Features */}
                      {pkg.features && pkg.features.length > 0 && (
                        <ul className="space-y-3 mb-6">
                          {pkg.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start text-sm text-gray-700 dark:text-gray-300">
                              <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      )}

                      {/* Buy Button */}
                      <button
                        onClick={() => handlePurchase(pkg)}
                        disabled={purchasing && selectedPackage === pkg.slug}
                        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                          pkg.isPrimary
                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-500/50'
                            : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-gray-700 dark:hover:bg-gray-600'
                        } ${
                          purchasing && selectedPackage === pkg.slug
                            ? 'opacity-50 cursor-not-allowed'
                            : 'hover:scale-105'
                        }`}
                      >
                        {purchasing && selectedPackage === pkg.slug ? (
                          <span className="flex items-center justify-center">
                            <RefreshCw className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            Processing...
                          </span>
                        ) : (
                          <span className="flex items-center justify-center">
                            <Zap className="w-5 h-5 mr-2" />
                            Buy Now
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Info */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
              Secure Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-3">Payment Methods</p>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Visa, Mastercard, Verve
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Mobile Money (MTN, Vodafone, AirtelTigo)
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Bank Transfer
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-3">Security & Trust</p>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    256-bit SSL Encryption
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    PCI DSS Compliant
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Powered by PayStack
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white mb-3">Benefits</p>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Credits never expire
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Instant activation
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    30-day refund policy
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Purchase History */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Purchase History
            </h2>
            
            {purchases.length === 0 ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
                <div className="text-6xl mb-4">💳</div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No purchases yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Your credit purchase history will appear here
                </p>
                <button
                  onClick={() => setActiveTab('buy')}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
                >
                  Buy Credits
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Package
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Credits
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Purchased By
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {purchases.map((purchase) => (
                        <tr key={purchase._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(purchase.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                            <br />
                            <span className="text-xs text-gray-500">
                              {new Date(purchase.createdAt).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {purchase.package.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            <span className="font-semibold">{purchase.package.credits.toLocaleString()}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {purchase.package.price.currency} {purchase.package.price.amount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {getStatusBadge(purchase.status)}
                            {purchase.creditsAdded && (
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1 flex items-center">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Credits added
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {purchase.purchasedBy.firstName} {purchase.purchasedBy.lastName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && pendingPackage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Choose Payment Method
              </h3>
              <button
                onClick={() => {
                  setShowPaymentMethodModal(false);
                  setPendingPackage(null);
                }}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Package: <span className="font-semibold text-gray-900 dark:text-white">{pendingPackage.name}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Credits: <span className="font-semibold text-gray-900 dark:text-white">{pendingPackage.credits.toLocaleString()}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Amount: <span className="font-semibold text-gray-900 dark:text-white">{pendingPackage.currency} {pendingPackage.price}</span>
              </p>
            </div>

            {/* Wallet Balance Display */}
            <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Wallet Balance</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {pendingPackage.currency} {walletBalance.toFixed(2)}
                </span>
              </div>
              {walletBalance < pendingPackage.price && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Insufficient balance. Need {pendingPackage.currency} {(pendingPackage.price - walletBalance).toFixed(2)} more.
                </p>
              )}
            </div>

            <div className="space-y-3">
              {/* Wallet Payment Option */}
              <button
                onClick={() => handlePaymentMethodSelect('wallet')}
                disabled={walletBalance < pendingPackage.price}
                className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                  walletBalance >= pendingPackage.price
                    ? 'border-blue-500 hover:bg-primary-50 dark:hover:bg-blue-900/20 cursor-pointer'
                    : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center mr-3">
                    <Wallet className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Pay with Wallet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Use your available balance</p>
                  </div>
                </div>
                {walletBalance >= pendingPackage.price && (
                  <CheckCircle className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                )}
              </button>

              {/* Paystack Payment Option */}
              <button
                onClick={() => handlePaymentMethodSelect('paystack')}
                className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
              >
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                    <CreditCard className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-gray-900 dark:text-white">Pay with Card</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Paystack secure payment</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </FeatureGate>
  );
};

export default MessagingCredits;