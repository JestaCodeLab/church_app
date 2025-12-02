import { useState, useCallback, useEffect } from 'react';
import { showToast } from '../utils/toasts';
import { settingsAPI } from '../services/api';

/**
 * Custom hook for PayStack payment integration
 * Uses PayStack Inline (loads script automatically)
 * 
 * ✅ Proper callback handling for PayStack
 * ✅ No async callbacks in PayStack setup
 * ✅ Follows React Hook rules
 * 
 * Usage:
 * const { initializePayment, loading, scriptLoaded } = usePaystackPayment();
 * 
 * initializePayment({
 *   email: user.email,
 *   amount: plan.price.amount * 100, // Convert to kobo
 *   planSlug: 'growth',
 *   onSuccess: () => { // handle success },
 *   onClose: () => { // optional close handler }
 * });
 */
export const usePaystackPayment = () => {
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
    email: string;
    amount: number; // in kobo (already multiplied by 100)
    planSlug: string;
    onSuccess: () => void;
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

      // Step 1: Initialize transaction on backend
      console.log('🔄 Initializing PayStack transaction for plan:', config.planSlug);
      const response = await settingsAPI.changePlan(config.planSlug);
      const { reference: txRef } = response.data.data;
      
      console.log('✅ Transaction initialized with reference:', txRef);
      setReference(txRef);

      // Step 2: Get PayStack Inline
      const PaystackPop = (window as any).PaystackPop;
      
      if (!PaystackPop) {
        throw new Error('PayStack is not available. Please refresh the page.');
      }

      console.log('💳 Opening PayStack popup...');

      // Step 3: Create handler for payment success (NON-ASYNC!)
      // PayStack expects synchronous callbacks, so we handle async operations separately
      const paymentReference = txRef;
      const successCallback = config.onSuccess;
      const closeCallback = config.onClose;

      // Step 4: Configure PayStack
      const paystackConfig: any = {
        key: publicKey,
        email: config.email,
        amount: config.amount,
        ref: paymentReference,
        currency: 'GHS',
        
        // ✅ FIXED: Non-async callback that PayStack expects
        callback: function(response: any) {
          console.log('✅ Payment successful:', response.reference);
          console.log('🔄 Starting payment verification...');
          
          // Handle verification asynchronously OUTSIDE the callback
          (async () => {
            try {
              await settingsAPI.verifyPayment(response.reference);
              console.log('✅ Payment verified successfully');
              showToast.success('Payment successful! Your subscription has been updated.');
              successCallback();
            } catch (error: any) {
              console.error('❌ Payment verification failed:', error);
              showToast.error('Payment verification failed. Please contact support with reference: ' + response.reference);
            } finally {
              setLoading(false);
            }
          })();
        },
        
        // ✅ FIXED: Non-async onClose
        onClose: function() {
          console.log('ℹ️ Payment popup closed by user');
          showToast.error('Payment cancelled. You can try again when ready.');
          
          if (closeCallback) {
            closeCallback();
          }
          setLoading(false);
        },
      };

      // Step 5: Setup and open PayStack
      const handler = PaystackPop.setup(paystackConfig);
      handler.openIframe();

    } catch (error: any) {
      console.error('❌ Payment initialization error:', error);
      
      // User-friendly error messages
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