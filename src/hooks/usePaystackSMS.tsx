import { useState, useCallback, useEffect } from 'react';
import { showToast } from '../utils/toasts';
import api from '../services/api';

/**
 * Custom hook for PayStack SMS credit purchases
 * Separate from subscription payments to avoid conflicts
 */
export const usePaystackSMS = () => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [reference, setReference] = useState<string>('');

  // Load PayStack script on mount
  useEffect(() => {
    // Check if script already loaded
    if ((window as any).PaystackPop) {
      setScriptLoaded(true);
      return;
    }

    // Create and load script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    
    script.onload = () => {
      console.log('✅ PayStack script loaded');
      setScriptLoaded(true);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load PayStack script');
      showToast.error('Failed to load payment system. Please refresh the page.');
    };

    document.body.appendChild(script);
  }, []);

  const initializePayment = useCallback(async (config: {
    reference: string;
    email: string;
    amount: number;
    metadata?: any;
    onSuccess: (reference: string) => void;
    onClose?: () => void;
  }) => {
    try {
      setLoading(true);

      // Check if script is loaded
      if (!scriptLoaded) {
        showToast.error('Payment system is still loading. Please try again in a moment.');
        setLoading(false);
        return;
      }

      // Validate public key
      const publicKey = process.env.REACT_APP_PAYSTACK_PUBLIC_KEY;
      if (!publicKey) {
        throw new Error('PayStack public key not configured. Please add REACT_APP_PAYSTACK_PUBLIC_KEY to your .env file.');
      }

      console.log('💳 Opening PayStack popup for SMS credits...');

      // Get PayStack Inline
      const PaystackPop = (window as any).PaystackPop;
      
      if (!PaystackPop) {
        throw new Error('PayStack is not available. Please refresh the page.');
      }

      const paymentReference = config.reference;
      const successCallback = config.onSuccess;
      const closeCallback = config.onClose;

      // Configure PayStack
      const paystackConfig: any = {
        key: publicKey,
        email: config.email,
        amount: config.amount,
        ref: paymentReference,
        currency: 'GHS',
        metadata: config.metadata,
        
        // Payment success callback
        callback: function(response: any) {
          console.log('✅ SMS credit payment successful:', response.reference);
          
          // Call success handler with reference
          successCallback(response.reference);
          setLoading(false);
        },
        
        // Payment closed/cancelled
        onClose: function() {
          console.log('Payment popup closed by user');
          
          if (closeCallback) {
            closeCallback();
          }
          setLoading(false);
        },
      };

      // Setup and open PayStack
      const handler = PaystackPop.setup(paystackConfig);
      handler.openIframe();

    } catch (error: any) {
      console.error('❌ Payment initialization error:', error);
      
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || 'Failed to initialize payment. Please try again.';
      
      showToast.error(errorMessage);
      setLoading(false);
    }
  }, [scriptLoaded]);

  return {
    initializePayment,
    loading,
    scriptLoaded,
    reference
  };
};