import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../../services/api';
import { showToast } from '../../utils/toasts';
import { Check, Crown, Users, Zap, TrendingUp, AlertCircle, Church, Download, Calendar, FileText, CreditCard, DollarSign, Filter, X, FileDown, CalendarDays, BookOpen, HardDrive, UserCircle, Building2, ChevronRight, CheckCircle, XCircle, Info, RotateCw, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usePaystackPayment } from '../../hooks/usePaystackPayment';
import DiscountCodeInput from '../ui/DiscountCodeInput';
import UsageMeter from '../ui/UsageMeter';

const BillingSettings = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [availablePlans, setAvailablePlans] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [billingHistory, setBillingHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<'usage' | 'plans' | 'history'>('plans');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [showAllMetrics, setShowAllMetrics] = useState(true);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);
  const { initializePayment, loading: paymentLoading, scriptLoaded } = usePaystackPayment();
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);

  useEffect(() => {
    fetchSubscription();
    fetchBillingHistory();
    fetchWalletBalance();
  }, []);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getSubscription();
      console.log('SUBSCRIPTION =>', response?.data?.data)
      setSubscription(response.data.data.subscription);
      setAvailablePlans(response.data.data.availablePlans);
    } catch (error) {
      showToast.error('Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletBalance = async () => {
    try {
      const response = await settingsAPI.getWalletBalance();
      setWalletBalance(response.data.data.availableBalance || 0);
    } catch (error) {
      console.error('Failed to fetch wallet balance:', error);
    }
  };

  const fetchBillingHistory = async (page = 1) => {
    try {
      setHistoryLoading(true);
      const params: any = { page, limit: 10 };
      
      // Apply filters
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (dateRange.start) {
        params.startDate = dateRange.start;
      }
      if (dateRange.end) {
        params.endDate = dateRange.end;
      }
      
      const response = await settingsAPI.getBillingHistory(params);
      setBillingHistory(response.data.data.transactions);
      setHistoryTotal(response.data.data.pagination.total);
      setHistoryPage(page);
    } catch (error) {
      showToast.error('Failed to load billing history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleExportHistory = () => {
    try {
      // Create CSV content
      const headers = ['Invoice Number', 'Date', 'Plan', 'Amount', 'Currency', 'Status', 'Discount'];
      const rows = billingHistory.map(t => [
        t.invoiceNumber,
        new Date(t.paymentDate).toLocaleDateString(),
        t.planName || t.plan,
        t.amount.toFixed(2),
        t.currency,
        t.status,
        t.discount ? `${t.discount.amountSaved?.toFixed(2)}` : '0'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n');
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `billing-history-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Billing history exported successfully');
    } catch (error) {
      showToast.error('Failed to export billing history');
    }
  };

  const applyFilters = () => {
    setHistoryPage(1);
    fetchBillingHistory(1);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setHistoryPage(1);
    fetchBillingHistory(1);
  };

  const calculateTotalSpent = () => {
    return billingHistory
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const handleDownloadInvoice = async (transactionId: string, invoiceNumber: string) => {
    try {
      const response = await settingsAPI.downloadInvoice(transactionId);
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'application/pdf' });
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      showToast.success('Invoice downloaded successfully');
    } catch (error) {
      showToast.error('Failed to download invoice');
    }
  };

  const handlePlanChange = async (planSlug: string) => {
    const selectedPlan = availablePlans.find((p: any) => p.slug === planSlug);
    
    if (!selectedPlan) return;

    setSelectedPlan(selectedPlan);

    // Free plan - no payment needed
    if (selectedPlan.price.amount === 0) {
      try {
        setActionLoading(true);
        await settingsAPI.changePlan(planSlug);
        showToast.success('Plan changed successfully!');
        setTimeout(() => {
        window.location.reload();
        }, 2000);
      } catch (error: any) {
        showToast.error(error.response?.data?.message || 'Failed to change plan');
      } finally {
        setActionLoading(false);
      }
      return;
    }

    // Paid plan - show upgrade modal with discount option
    setShowUpgradeModal(true);
  };

  const handleRenewSubscription = async () => {
    // Find the current plan in available plans
    const currentPlan = availablePlans.find((p: any) => p.slug === subscription?.plan);
    
    if (!currentPlan) {
      showToast.error('Unable to find your current plan');
      return;
    }

    setSelectedPlan(currentPlan);

    // If it's a free plan, just apply directly
    if (currentPlan.price.amount === 0) {
      try {
        setActionLoading(true);
        await settingsAPI.changePlan(currentPlan.slug);
        showToast.success('Subscription renewed successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error: any) {
        showToast.error(error.response?.data?.message || 'Failed to renew subscription');
      } finally {
        setActionLoading(false);
      }
      return;
    }

    // For paid plans, initiate payment directly
    await initializePayment({
      email: user?.email || '',
      amount: currentPlan.price.amount * 100, // Convert to kobo/pesewas
      planSlug: currentPlan.slug,
      discountCode: null,
      onSuccess: () => {
        showToast.success('Subscription renewed successfully!');
        setSelectedPlan(null);
        setAppliedDiscount(null);
        window.location.reload();
      },
      onClose: () => {
        setSelectedPlan(null);
      }
    });
  };

  const handleConfirmUpgrade = async () => {
    if (!selectedPlan) return;

    // Show payment method selection modal
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = async (method: 'wallet' | 'paystack') => {
    if (!selectedPlan) return;

    setShowPaymentMethodModal(false);
    
    const finalAmount = appliedDiscount 
      ? appliedDiscount.finalAmount 
      : selectedPlan.price.amount;

    if (method === 'wallet') {
      await handleWalletPayment(finalAmount);
    } else {
      await handlePaystackPayment(finalAmount);
    }
  };

  const handleWalletPayment = async (finalAmount: number) => {
    try {
      setActionLoading(true);
      const response = await settingsAPI.changePlan(
        selectedPlan.slug,
        appliedDiscount?.code || null,
        'wallet'
      );

      if (response.data.success) {
        showToast.success('Subscription upgraded successfully with wallet!');
        setShowUpgradeModal(false);
        setSelectedPlan(null);
        setAppliedDiscount(null);
        setTimeout(() => window.location.reload(), 2000);
      }
    } catch (error: any) {
      showToast.error(error.response?.data?.message || 'Failed to upgrade with wallet');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaystackPayment = async (finalAmount: number) => {
    // Initiate payment
    await initializePayment({
      email: user?.email || '',
      amount: finalAmount * 100, // Convert to kobo/pesewas
      planSlug: selectedPlan.slug,
      discountCode: appliedDiscount?.code || null,
      onSuccess: () => {
        showToast.success('Subscription updated successfully!');
        setShowUpgradeModal(false);
        setSelectedPlan(null);
        setAppliedDiscount(null);
        window.location.reload();
      },
      onClose: () => {
        setShowUpgradeModal(false);
      }
    });
  };

  const getPlanIcon = (planSlug: string) => {
    switch (planSlug) {
      case 'starter': return <Users className="w-6 h-6 text-gray-500" />;
      case 'basic': return <Church className="w-6 h-6 text-orange-500" />;
      case 'growth': return <Zap className="w-6 h-6 text-blue-500" />;
      case 'enterprise': return <Crown className="w-6 h-6 text-purple-500" />;
      default: return <Users className="w-6 h-6 text-gray-500" />;
    }
  };

  const getPlanSubText = (planSlug: string) => {
    switch (planSlug) {
      case 'starter': return 'Perfect for new churches getting started';
      case 'basic': return 'Ideal for small churches starting out.';
      case 'growth': return 'Perfect for growing congregations.';
      case 'enterprise': return 'Best for large churches with advanced needs.';
      default: return '';
    }
  };

  const isNearLimit = (current: number, limit: number | null) => {
    if (!limit) return false;
    return (current / limit) >= 0.8; // 80% or more
  };

  const getUtilizationPercentage = (current: number, limit: number | null) => {
    if (!limit || limit === 0) return 0;
    return Math.round((current / limit) * 100);
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'red';
    if (percentage >= 80) return 'yellow';
    return 'green';
  };

  const getUtilizationStatus = (percentage: number) => {
    if (percentage >= 90) return { text: 'Critical', icon: XCircle, color: 'text-red-600 dark:text-red-400' };
    if (percentage >= 80) return { text: 'Warning', icon: AlertCircle, color: 'text-yellow-600 dark:text-yellow-400' };
    return { text: 'Healthy', icon: CheckCircle, color: 'text-green-600 dark:text-green-400' };
  };

  const getMetricIcon = (metricName: string) => {
    const iconMap: { [key: string]: any } = {
      'Members': Users,
      'Branches': Building2,
      'Departments': Building2,
      'Events': CalendarDays,
      'Sermons': BookOpen,
      'Users': UserCircle,
      'Storage (GB)': HardDrive,
    };
    return iconMap[metricName] || Users;
  };

  const getMetricDescription = (metricName: string) => {
    const descriptions: { [key: string]: string } = {
      'Members': 'Total church members in your database',
      'Branches': 'Active branch locations',
      'Departments': 'Organizational departments or ministries',
      'Events': 'Created events and programs',
      'Sermons': 'Sermon recordings and notes',
      'Users': 'Staff and admin user accounts',
      'Storage (GB)': 'File storage for media and documents',
    };
    return descriptions[metricName] || '';
  };

  const getOverallUsageHealth = () => {
    if (!subscription?.usage || !subscription?.limits) return { status: 'good', percentage: 0, critical: 0, warning: 0 };
    
    const metrics = ['members', 'branches', 'departments', 'events', 'sermons', 'users', 'storage'];
    let totalPercentage = 0;
    let count = 0;
    let critical = 0;
    let warning = 0;

    metrics.forEach(metric => {
      if (subscription.limits[metric] !== undefined && subscription.limits[metric] !== null) {
        const percentage = getUtilizationPercentage(subscription.usage[metric] || 0, subscription.limits[metric]);
        totalPercentage += percentage;
        count++;
        
        if (percentage >= 90) critical++;
        else if (percentage >= 80) warning++;
      }
    });

    const avgPercentage = count > 0 ? Math.round(totalPercentage / count) : 0;
    let status = 'good';
    if (critical > 0) status = 'critical';
    else if (warning > 0) status = 'warning';

    return { status, percentage: avgPercentage, critical, warning, total: count };
  };

  const getFilteredMetrics = () => {
    const allMetrics = [
      { key: 'members', name: 'Members' },
      { key: 'branches', name: 'Branches' },
      { key: 'departments', name: 'Departments' },
      { key: 'events', name: 'Events' },
      { key: 'sermons', name: 'Sermons' },
      { key: 'users', name: 'Users' },
      { key: 'storage', name: 'Storage (GB)' },
    ];

    return allMetrics.filter(metric => {
      const hasLimit = subscription.limits?.[metric.key] !== undefined;
      if (!hasLimit) return false;
      
      if (!showAllMetrics) {
        const percentage = getUtilizationPercentage(
          subscription.usage[metric.key] || 0,
          subscription.limits[metric.key]
        );
        return percentage >= 50; // Show only metrics above 50% when filtered
      }
      
      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading billing settings...</p>
        </div>
      </div>
    );
  }

  if (!subscription || !availablePlans) {
    return <div className="text-center p-8">Could not load subscription details.</div>;
  }

  return (
    <>
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Plan Card */}
        <div className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg border border-primary-200 dark:border-primary-800 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
                  <div className='flex gap-2'>
                      <span className="text-sm font-medium text-primary-600 dark:text-primary-400">Current Plan</span>
                      {/* Status Badge */}
                      <div>
                        {/* {subscription?.expirationStatus === 'active' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
                            <CheckCircle className="w-3 h-3" />
                            Active subscription
                          </span>
                        )} */}
                        {subscription?.expirationStatus === 'expiring-soon' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-medium">
                            <AlertCircle className="w-3 h-3" />
                            Expiring soon
                          </span>
                        )}
                        {subscription?.expirationStatus === 'expired' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium">
                            <XCircle className="w-3 h-3" />
                            Expired
                          </span>
                        )}
                        {subscription?.expirationStatus === 'free-tier' && (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-medium">
                            <Info className="w-3 h-3" />
                            Free tier
                          </span>
                        )}
                      </div>
                  </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {subscription?.plan?.charAt(0).toUpperCase() + subscription?.plan?.slice(1) || 'N/A'}
              </p>
            </div>
            <Crown className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          </div>
          
          

          {/* Renew Button for Expired or Expiring Soon Subscriptions */}
          {(subscription?.expirationStatus === 'expired' || subscription?.expirationStatus === 'expiring-soon') && (
            <button
              onClick={handleRenewSubscription}
              disabled={actionLoading || paymentLoading || !scriptLoaded}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCw className="w-4 h-4" />
              {actionLoading || paymentLoading ? 'Processing...' : 'Renew Subscription'}
            </button>
          )}
        </div>

        {/* Next Billing Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Next Billing</span>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {subscription?.nextBillingDate 
              ? new Date(subscription.nextBillingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              : 'N/A'}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {subscription?.nextBillingDate 
              ? `${Math.ceil((new Date(subscription.nextBillingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days remaining`
              : 'No upcoming billing'}
          </p>
        </div>

        {/* Total Spent Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</span>
            <DollarSign className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            GHS {calculateTotalSpent().toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            All-time payments
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px px-4">
            <button
              onClick={() => setActiveTab('plans')}
              className={`px-8 py-4 text-base font-medium border-b-2 transition-colors ${
                activeTab === 'plans'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Plans & Pricing
            </button>
            <button
              onClick={() => setActiveTab('usage')}
              className={`px-8 py-4 text-base font-medium border-b-2 transition-colors ${
                activeTab === 'usage'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Usage & Limits
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-8 py-4 text-base font-medium border-b-2 transition-colors ${
                activeTab === 'history'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Billing History
              {historyTotal > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                  {historyTotal}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Plans Tab */}
          {activeTab === 'plans' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Available Plans
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Choose the plan that best fits your church's needs
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availablePlans?.map((plan: any) => {
                  const isCurrent = subscription.plan === plan.slug;

                  return (
                    <div 
                      key={plan.slug} 
                      className={`rounded-xl border-2 p-6 transition-all ${
                        isCurrent 
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/10 shadow-md' 
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-center space-x-3 mb-4">
                        {getPlanIcon(plan?.slug)}
                        <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">{plan.name}</h4>
                      </div>
                      
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                        {plan.price?.amount > 0 ? `GHS ${plan.price?.amount}` : 'Free'}
                        {plan.price?.amount > 0 && (
                          <span className="text-sm font-normal text-gray-500">/month</span>
                        )}
                      </p>
                      
                      <p className="text-sm text-gray-500 dark:text-gray-400 min-h-[2.5rem]">
                        {getPlanSubText(plan?.slug)}
                      </p>
                      
                      <ul className="space-y-2 mt-4 text-sm">
                        {plan.highlights?.map((feature: any, i: number) => (
                          <li key={i} className="flex items-center">
                            <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            <span className="text-gray-600 dark:text-gray-300">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                      
                      <button
                        onClick={() => handlePlanChange(plan?.slug)}
                        disabled={isCurrent || actionLoading}
                        className={`w-full mt-6 py-2.5 rounded-lg font-semibold transition-colors ${
                          isCurrent 
                            ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 cursor-not-allowed' 
                            : 'bg-primary-600 hover:bg-primary-700 text-white'
                        }`}
                      >
                        {isCurrent ? 'Current Plan' : (actionLoading ? 'Processing...' : 'Select Plan')}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

      {/* Usage Tab */}
      {activeTab === 'usage' && subscription.usage && (
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Resource Usage
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your resource consumption across all plan limits
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowAllMetrics(!showAllMetrics)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                {showAllMetrics ? 'Show Active Only' : 'Show All'}
              </button>
            </div>
          </div>

          {/* Overall Health Summary */}
          {(() => {
            const health = getOverallUsageHealth();
            return (
              <div className={`mb-6 p-4 rounded-lg border-2 ${
                health.status === 'critical' 
                  ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'
                  : health.status === 'warning'
                  ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  : 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {health.status === 'critical' ? (
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                    ) : health.status === 'warning' ? (
                      <AlertCircle className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                    )}
                    <div>
                      <h4 className={`font-semibold ${
                        health.status === 'critical' 
                          ? 'text-red-900 dark:text-red-100'
                          : health.status === 'warning'
                          ? 'text-yellow-900 dark:text-yellow-100'
                          : 'text-green-900 dark:text-green-100'
                      }`}>
                        {health.status === 'critical' ? 'Action Required' : health.status === 'warning' ? 'Approaching Limits' : 'All Systems Healthy'}
                      </h4>
                      <p className={`text-sm ${
                        health.status === 'critical' 
                          ? 'text-red-700 dark:text-red-300'
                          : health.status === 'warning'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : 'text-green-700 dark:text-green-300'
                      }`}>
                        {health.critical > 0 && `${health.critical} metric${health.critical > 1 ? 's' : ''} at critical level. `}
                        {health.warning > 0 && `${health.warning} metric${health.warning > 1 ? 's' : ''} need attention. `}
                        {health.status === 'good' && 'Your resources are well within limits'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-3xl font-bold ${
                      health.status === 'critical' 
                        ? 'text-red-600 dark:text-red-400'
                        : health.status === 'warning'
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      {health.percentage}%
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Avg. Utilization</div>
                  </div>
                </div>
                {(health.critical > 0 || health.warning > 0) && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setActiveTab('plans')}
                      className="inline-flex items-center text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                    >
                      Upgrade Plan to Increase Limits
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {getFilteredMetrics().map((metric) => {
              const current = subscription.usage[metric.key] || 0;
              const limit = subscription.limits[metric.key];
              const percentage = getUtilizationPercentage(current, limit);
              const status = getUtilizationStatus(percentage);
              const Icon = getMetricIcon(metric.name);
              const isExpanded = expandedMetric === metric.key;
              const remaining = limit ? limit - current : 0;

              return (
                <div
                  key={metric.key}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => setExpandedMetric(isExpanded ? null : metric.key)}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        percentage >= 90 
                          ? 'bg-red-100 dark:bg-red-900/30'
                          : percentage >= 80
                          ? 'bg-yellow-100 dark:bg-yellow-900/30'
                          : 'bg-primary-100 dark:bg-primary-900/30'
                      }`}>
                        <Icon className={`w-5 h-5 ${
                          percentage >= 90 
                            ? 'text-red-600 dark:text-red-400'
                            : percentage >= 80
                            ? 'text-yellow-600 dark:text-yellow-400'
                            : 'text-primary-600 dark:text-primary-400'
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {metric.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {current.toLocaleString()} / {limit ? limit.toLocaleString() : '∞'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        percentage >= 90 
                          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          : percentage >= 80
                          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      }`}>
                        {percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          percentage >= 90 
                            ? 'bg-red-500'
                            : percentage >= 80
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                      <status.icon className={`w-3 h-3 ${status.color}`} />
                      <span>{status.text}</span>
                    </div>
                    {limit && (
                      <span className="text-gray-600 dark:text-gray-400">
                        {remaining > 0 ? `${remaining.toLocaleString()} remaining` : 'Limit reached'}
                      </span>
                    )}
                  </div>

                  {/* Expanded Info */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 animate-in slide-in-from-top">
                      <div className="flex items-start gap-2 mb-2">
                        <Info className="w-4 h-4 text-gray-400 mt-0.5" />
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {getMetricDescription(metric.name)}
                        </p>
                      </div>
                      {percentage >= 80 && (
                        <div className="mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTab('plans');
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                          >
                            Upgrade to Increase Limit
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Empty State */}
          {getFilteredMetrics().length === 0 && (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No active usage metrics</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                {showAllMetrics ? 'Your plan has no defined limits' : 'All metrics are below 50% utilization'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Billing History Tab */}
      {activeTab === 'history' && (
        <div>
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Billing History
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View and download invoices for all your subscription payments
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    viewMode === 'cards'
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  Cards
                </button>
              </div>

              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {(statusFilter !== 'all' || dateRange.start || dateRange.end) && (
                  <span className="ml-2 w-2 h-2 bg-primary-600 rounded-full"></span>
                )}
              </button>

              {/* Export Button */}
              <button
                onClick={handleExportHistory}
                disabled={billingHistory.length === 0}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Filter Transactions</h4>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="success">Success</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <button
                  onClick={applyFilters}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  Apply Filters
                </button>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {historyLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading transactions...</p>
            </div>
          ) : billingHistory.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No billing history yet</p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                Your subscription payments will appear here
              </p>
            </div>
          ) : (
            <>
              {/* Table View */}
              {viewMode === 'table' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Invoice
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Plan
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-400">
                          Invoice
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {billingHistory.map((transaction: any) => (
                        <tr 
                          key={transaction._id}
                          className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {transaction.invoiceNumber}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                              <Calendar className="w-4 h-4 mr-2" />
                              {new Date(transaction.paymentDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {transaction.planName || transaction.plan}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <div className="text-sm">
                              <span className="font-semibold text-gray-900 dark:text-gray-100">
                                {transaction.currency} {transaction.amount.toFixed(2)}
                              </span>
                              {transaction.discount && (
                                <span className="text-xs text-green-600 dark:text-green-400 ml-1">
                                  (Saved {transaction.currency} {transaction.discount.amountSaved?.toFixed(2)})
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.status === 'success'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                                : transaction.status === 'pending'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                                : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                            }`}>
                              {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {transaction.status === 'success' && (
                              <button
                                onClick={() => handleDownloadInvoice(transaction._id, transaction.invoiceNumber)}
                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Download
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Cards View */
                <div className="grid grid-cols-1 gap-4">
                  {billingHistory.map((transaction: any) => (
                    <div
                      key={transaction._id}
                      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-gray-400 mr-3" />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                              {transaction.invoiceNumber}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {transaction.planName || transaction.plan}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.status === 'success'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
                            : transaction.status === 'pending'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(transaction.paymentDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                            {transaction.currency} {transaction.amount.toFixed(2)}
                          </p>
                          {transaction.discount && (
                            <p className="text-xs text-green-600 dark:text-green-400">
                              Saved {transaction.currency} {transaction.discount.amountSaved?.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>

                      {transaction.status === 'success' && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <button
                            onClick={() => handleDownloadInvoice(transaction._id, transaction.invoiceNumber)}
                            className="w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download Invoice
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {historyTotal > 10 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing {Math.min((historyPage - 1) * 10 + 1, historyTotal)} - {Math.min(historyPage * 10, historyTotal)} of {historyTotal} transactions
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fetchBillingHistory(historyPage - 1)}
                      disabled={historyPage === 1}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => fetchBillingHistory(historyPage + 1)}
                      disabled={historyPage * 10 >= historyTotal}
                      className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
        </div>
      </div>
    </div>

      {/* Upgrade Modal with Discount Code */}
      {showUpgradeModal && selectedPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75"
              onClick={() => {
                setShowUpgradeModal(false);
                setAppliedDiscount(null);
              }}
            />

            {/* Modal */}
            <div className="relative inline-block w-full max-w-lg my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Upgrade to {selectedPlan.name}
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-400 mb-6">
                  Review your order and apply a discount code if you have one
                </p>

                {/* Plan Summary */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base text-gray-600 dark:text-gray-400">Plan:</span>
                    <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                      {selectedPlan.name}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-base text-gray-600 dark:text-gray-400">Price:</span>
                    <span className="font-medium text-base text-gray-900 dark:text-gray-100">
                      GHS {selectedPlan.price.amount} / month
                    </span>
                  </div>
                </div>

                {/* Discount Code Input */}
                <DiscountCodeInput
                  planSlug={selectedPlan.slug}
                  merchantId={user?.merchant?.id || ''}
                  onDiscountApplied={(discount) => setAppliedDiscount(discount)}
                  onDiscountRemoved={() => setAppliedDiscount(null)}
                  className="mb-6"
                />

                {/* Total */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-gray-900 dark:text-gray-100">Total:</span>
                    <span className="text-primary-600 dark:text-primary-400">
                      GHS {appliedDiscount ? appliedDiscount.finalAmount : selectedPlan.price.amount}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setShowUpgradeModal(false);
                      setAppliedDiscount(null);
                    }}
                    className="flex-1 px-4 py-2 text-base font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmUpgrade}
                    disabled={paymentLoading}
                    className="flex-1 px-4 py-2 text-base font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {paymentLoading ? 'Processing...' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Method Selection Modal */}
      {showPaymentMethodModal && selectedPlan && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div 
              className="fixed inset-0 bg-black bg-opacity-50"
              onClick={() => setShowPaymentMethodModal(false)}
            />
            
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Choose Payment Method
                </h3>
                <button
                  onClick={() => setShowPaymentMethodModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Plan: <span className="font-semibold text-gray-900 dark:text-white">{selectedPlan.name}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Amount: <span className="font-semibold text-gray-900 dark:text-white">
                    GHS {appliedDiscount ? appliedDiscount.finalAmount : selectedPlan.price.amount}
                  </span>
                </p>
              </div>

              {/* Wallet Balance Display */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Wallet Balance</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">
                    GHS {walletBalance.toFixed(2)}
                  </span>
                </div>
                {walletBalance < (appliedDiscount ? appliedDiscount.finalAmount : selectedPlan.price.amount) && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    Insufficient balance. Need GHS {((appliedDiscount ? appliedDiscount.finalAmount : selectedPlan.price.amount) - walletBalance).toFixed(2)} more.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                {/* Wallet Payment Option */}
                <button
                  onClick={() => handlePaymentMethodSelect('wallet')}
                  disabled={walletBalance < (appliedDiscount ? appliedDiscount.finalAmount : selectedPlan.price.amount)}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    walletBalance >= (appliedDiscount ? appliedDiscount.finalAmount : selectedPlan.price.amount)
                      ? 'border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer'
                      : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mr-3">
                      <Wallet className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900 dark:text-white">Pay with Wallet</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Use your available balance</p>
                    </div>
                  </div>
                  {walletBalance >= (appliedDiscount ? appliedDiscount.finalAmount : selectedPlan.price.amount) && (
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                </button>

                {/* Paystack Payment Option */}
                <button
                  onClick={() => handlePaymentMethodSelect('paystack')}
                  className="w-full flex items-center justify-between p-4 rounded-lg border-2 border-gray-300 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all"
                >
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mr-3">
                      <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
        </div>
      )}
    </>
  );
};

export default BillingSettings;