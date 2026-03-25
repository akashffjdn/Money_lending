import { Alert, Platform } from 'react-native';
import Constants from 'expo-constants';

const RAZORPAY_KEY = 'rzp_test_SVPpUX9aoUB4KN';

export interface RazorpayOrderOptions {
  amount: number; // in rupees (will be converted to paise)
  description: string;
  orderId?: string; // from your backend
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface RazorpayErrorResponse {
  code: number;
  description: string;
}

/**
 * Check if we're running in Expo Go (no native modules available)
 */
const isExpoGo = Constants.appOwnership === 'expo';

/**
 * Opens Razorpay checkout on dev builds (Android/iOS).
 * Falls back to simulated payment on Expo Go & web since Razorpay is a native module.
 */
export const openRazorpayCheckout = async (
  options: RazorpayOrderOptions,
): Promise<{ success: true; data: RazorpaySuccessResponse } | { success: false; error: RazorpayErrorResponse }> => {

  // Expo Go or Web — use simulated payment
  if (Platform.OS === 'web' || isExpoGo) {
    return simulatePayment(options);
  }

  // Dev build — use real Razorpay
  try {
    const RazorpayCheckout = require('react-native-razorpay').default;

    const razorpayOptions: any = {
      key: RAZORPAY_KEY,
      amount: Math.round(options.amount * 100),
      currency: 'INR',
      name: 'LendEase',
      description: options.description,
      prefill: {
        name: options.prefill?.name ?? 'Test User',
        email: options.prefill?.email ?? 'user@lendease.com',
        contact: options.prefill?.contact ?? '9999999999',
      },
      notes: options.notes ?? {},
      theme: {
        color: '#C8850A',
      },
    };

    if (options.orderId) {
      razorpayOptions.order_id = options.orderId;
    }

    const data = await RazorpayCheckout.open(razorpayOptions);
    return { success: true, data };
  } catch (error: any) {
    console.log('Razorpay Error:', JSON.stringify(error));
    return {
      success: false,
      error: {
        code: error?.code ?? 0,
        description: error?.description ?? 'Payment was cancelled',
      },
    };
  }
};

/**
 * Simulated payment for Expo Go & web testing.
 * Shows an Alert on mobile / confirm on web, then simulates processing.
 * Automatically switches to real Razorpay when you create a dev build.
 */
const simulatePayment = async (
  options: RazorpayOrderOptions,
): Promise<{ success: true; data: RazorpaySuccessResponse } | { success: false; error: RazorpayErrorResponse }> => {
  const confirmed = await new Promise<boolean>((resolve) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      resolve(window.confirm(
        `[Razorpay Test Mode]\n\nPay ₹${options.amount.toLocaleString('en-IN')}?\n\n${options.description}\n\nClick OK to simulate payment, Cancel to abort.`,
      ));
    } else {
      Alert.alert(
        'Pay with Razorpay',
        `₹${options.amount.toLocaleString('en-IN')}\n\n${options.description}\n\n(Simulated — real Razorpay will open on dev builds)`,
        [
          { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
          { text: 'Pay Now', onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    }
  });

  if (!confirmed) {
    return {
      success: false,
      error: { code: 2, description: 'Payment cancelled by user' },
    };
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 90% success rate
  if (Math.random() < 0.9) {
    return {
      success: true,
      data: {
        razorpay_payment_id: `pay_test_${Date.now()}`,
        razorpay_order_id: `order_test_${Date.now()}`,
      },
    };
  }

  return {
    success: false,
    error: { code: 1, description: 'Payment failed (simulated)' },
  };
};
