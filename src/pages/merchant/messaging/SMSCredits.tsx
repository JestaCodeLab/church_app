import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../../services/api';
import toast from 'react-hot-toast';
import { usePaystackPayment } from '../../../hooks/usePaystackPayment';
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
  Award
} from 'lucide-react';

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
  const { initializePayment } =   usePaystackPayment();

  const [credits, setCredits] = useState<Credits | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'buy' | 'history'>('buy');

  useEffect(() => {
    fetchData();
    
    // Check for payment verification (fallback for redirect method)
    const reference = searchParams.get('reference');
    if (reference) {
      verifyPayment(reference);
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [creditsRes, packagesRes, purchasesRes] = await Promise.all([
        api.get('/sms/credits'),
        api.get('/sms/credit-packages'),
        api.get('/sms/purchase-history?limit=10')
      ]);

      setCredits(creditsRes.data.data.credits);
      setPackages(packagesRes.data.data.packages);
      setPurchases(purchasesRes.data.data.purchases);
    } catch (error: any) {
      toast.error('Failed to load credits data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      const response = await api.get(`/sms/verify-purchase/${reference}`);
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchData();
        navigate('/messaging/credits', { replace: true });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Payment verification failed';
      toast.error(errorMsg);
    }
  };

  const handlePurchase = async (pkg: CreditPackage) => {
    setPurchasing(true);
    setSelectedPackage(pkg.slug);

    try {
      // Initialize purchase on backend
      const response = await api.post('/sms/purchase-credits', {
        packageId: pkg?.id || pkg?._id,
        paymentMethod: 'paystack'
      });

      if (response.data.success) {
        const { reference, amount, email } = response.data.data;
        
        // Use the usePaystack hook to open popup
        initializePayment({
          email,
          amount,
          metadata: {
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
          onSuccess: () => handlePaymentSuccess(reference?.reference),
          onClose: () => {
            setPurchasing(false);
            setSelectedPackage(null);
            toast.error('Payment cancelled');
          }
        });
      } else {
        toast.error('Failed to initiate payment');
        setPurchasing(false);
        setSelectedPackage(null);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Failed to initiate purchase';
      toast.error(errorMsg);
      setPurchasing(false);
      setSelectedPackage(null);
    }
  };

  const handlePaymentSuccess = async (reference: string) => {
    try {
      toast.loading('Verifying payment...', { id: 'verify-payment' });
      
      const response = await api.get(`/sms/verify-purchase/${reference}`);
      
      if (response.data.success) {
        toast.success(response.data.message, { id: 'verify-payment' });
        
        // Refresh data
        await fetchData();
        
        // Reset state
        setPurchasing(false);
        setSelectedPackage(null);
      }
    } catch (error: any) {
      toast.error('Payment verification failed', { id: 'verify-payment' });
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
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
        <button
          onClick={() => fetchData()}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
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
                <p className="text-sm text-blue-100">Total Balance</p>
                <p className="text-3xl font-bold">{credits.balance.toLocaleString()}</p>
                <p className="text-xs text-blue-100 mt-1">SMS Credits</p>
              </div>
            </div>
            <div className="pt-4 border-t border-blue-500/30">
              <div className="flex justify-between text-sm">
                <span className="text-blue-100">Plan Credits:</span>
                <span className="font-medium">{credits.planCredits.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-blue-100">Purchased:</span>
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
                <Package className="w-6 h-6 text-purple-600 dark:text-purple-400" />
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
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            }`}
          >
            Buy Credits
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'history'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
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
                          <div className="text-right">
                            <p className="text-xs text-gray-600 dark:text-gray-400">Price per SMS</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                              {pkg.currency} {pkg.pricePerSMS}
                            </p>
                          </div>
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
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <CreditCard className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
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
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
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
    </div>
  );
};

export default MessagingCredits;