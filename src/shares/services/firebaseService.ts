import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth';
import { firebaseConfig } from '../../config/firebase.config';

// Store original fetch
const originalFetch = window.fetch;

// Initialize Firebase
let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

// Initialize Firebase Auth
export const auth = getAuth(app);

// Format phone number to international format
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with +84
  if (digits.startsWith('0')) {
    return `+84${digits.substring(1)}`;
  }
  
  // If doesn't start with +, add +84
  if (!phone.startsWith('+')) {
    return `+84${digits}`;
  }
  
  return phone;
};

// Initialize reCAPTCHA verifier
let recaptchaVerifier: RecaptchaVerifier | null = null;

export const initializeRecaptcha = (containerId: string = 'recaptcha-container'): RecaptchaVerifier => {
  // Clean up existing verifier
  if (recaptchaVerifier) {
    try {
      recaptchaVerifier.clear();
    } catch (error) {
      console.warn('Error clearing existing reCAPTCHA:', error);
    }
  }

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
        console.log('reCAPTCHA verified successfully');
      },
      'expired-callback': () => {
        // reCAPTCHA expired
        console.warn('reCAPTCHA expired');
        if (recaptchaVerifier) {
          recaptchaVerifier.clear();
          recaptchaVerifier = null;
        }
      },
    });

    return recaptchaVerifier;
  } catch (error: any) {
    console.error('Error initializing reCAPTCHA:', error);
    // Fallback: Try with visible reCAPTCHA if invisible fails
    if (error.code === 'auth/configuration-not-found' || error.message?.includes('recaptcha')) {
      console.warn('Invisible reCAPTCHA not configured, trying visible reCAPTCHA...');
      recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
        size: 'normal',
        callback: () => {
          console.log('reCAPTCHA verified successfully');
        },
        'expired-callback': () => {
          console.warn('reCAPTCHA expired');
        },
      });
      return recaptchaVerifier;
    }
    throw error;
  }
};

// Send OTP via Firebase Phone Auth
export const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  // Format phone number outside try block so it's available in catch
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Store server response for error diagnosis
  let serverResponse: any = null;
  
  // Log Firebase config for debugging
  console.log('[Firebase] Current Firebase config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 20)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    hasAllConfig: !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId),
  });
  
  try {
    console.log('[Firebase] Sending OTP to:', formattedPhone);
    
    // Clean up existing reCAPTCHA if it exists
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      } catch (clearError) {
        console.warn('[Firebase] Error clearing existing reCAPTCHA:', clearError);
        recaptchaVerifier = null;
      }
    }
    
    // Initialize reCAPTCHA
    console.log('[Firebase] Initializing reCAPTCHA...');
    initializeRecaptcha();

    // Render reCAPTCHA if needed (for visible reCAPTCHA)
    // For invisible reCAPTCHA, render() is not needed
    try {
      await recaptchaVerifier!.render();
      console.log('[Firebase] reCAPTCHA rendered successfully');
    } catch (renderError: any) {
      // If render fails because already rendered or invisible, that's OK
      if (renderError.message?.includes('already rendered') || 
          renderError.message?.includes('invisible')) {
        console.log('[Firebase] reCAPTCHA already rendered or invisible, continuing...');
      } else {
        console.warn('[Firebase] reCAPTCHA render warning:', renderError);
        // Don't throw, continue with sending OTP
      }
    }

    // Send OTP
    console.log('[Firebase] Calling signInWithPhoneNumber...');
    console.log('[Firebase] reCAPTCHA verifier state:', {
      exists: !!recaptchaVerifier,
      containerId: recaptchaVerifier ? 'recaptcha-container' : 'N/A',
    });
    
    // Intercept fetch to see actual server response
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      if (args[0]?.toString().includes('sendVerificationCode')) {
        const clonedResponse = response.clone();
        try {
          serverResponse = await clonedResponse.json();
          console.error('[Firebase] ===== SERVER RESPONSE DETAILS =====');
          console.error('[Firebase] Full response:', JSON.stringify(serverResponse, null, 2));
          if (serverResponse.error) {
            console.error('[Firebase] Error code:', serverResponse.error.code);
            console.error('[Firebase] Error message:', serverResponse.error.message);
            console.error('[Firebase] Error status:', serverResponse.error.status);
            if (serverResponse.error.details) {
              console.error('[Firebase] Error details:', serverResponse.error.details);
            }
          }
          console.error('[Firebase] ====================================');
        } catch (e) {
          console.error('[Firebase] Could not parse server response:', e);
        }
      }
      return response;
    };
    
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier!);
    
    // Restore original fetch
    window.fetch = originalFetch;
    
    console.log('[Firebase] OTP sent successfully');
    
    return confirmationResult;
  } catch (error: any) {
    // Restore original fetch in case of error
    if (window.fetch !== originalFetch) {
      window.fetch = originalFetch;
    }
    
    console.error('[Firebase] Error sending OTP:', error);
    console.error('[Firebase] Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack,
      formattedPhone,
      phoneNumber,
      serverResponse: serverResponse || 'No server response captured',
    });
    
    // Log specific error information
    if (error.code === 'auth/invalid-app-credential') {
      console.error('[Firebase] ===== INVALID APP CREDENTIAL DIAGNOSIS =====');
      console.error('[Firebase] 1. Checking Firebase config...');
      console.error('[Firebase]    - API Key:', firebaseConfig.apiKey ? 'EXISTS' : 'MISSING');
      console.error('[Firebase]    - Auth Domain:', firebaseConfig.authDomain || 'MISSING');
      console.error('[Firebase]    - Project ID:', firebaseConfig.projectId || 'MISSING');
      console.error('[Firebase] 2. Server response:', serverResponse);
      console.error('[Firebase] 3. Possible causes:');
      console.error('[Firebase]    a) reCAPTCHA token invalid or missing');
      console.error('[Firebase]    b) API key restrictions blocking request');
      console.error('[Firebase]    c) Domain not authorized in Firebase');
      console.error('[Firebase]    d) OAuth consent screen not configured');
      console.error('[Firebase] ============================================');
    }
    
    // Provide user-friendly error messages
    let errorMessage = 'Không thể gửi mã OTP. Vui lòng thử lại.';
    
    if (error.code === 'auth/invalid-app-credential') {
      errorMessage = 'Cấu hình ứng dụng không hợp lệ. Vui lòng kiểm tra API key và cấu hình Firebase.';
      console.error('[Firebase] Invalid app credential. Check:');
      console.error('1. API key restrictions in Google Cloud Console');
      console.error('2. Authorized domains in Firebase Console');
      console.error('3. Identity Toolkit API is enabled');
      console.error('4. Firebase config is correct');
    } else if (error.code === 'auth/configuration-not-found') {
      errorMessage = 'reCAPTCHA chưa được cấu hình. Vui lòng liên hệ quản trị viên hoặc cấu hình reCAPTCHA trong Firebase Console.';
      console.error('[Firebase] reCAPTCHA configuration error. Please configure reCAPTCHA in Firebase Console.');
    } else if (error.code === 'auth/invalid-phone-number') {
      errorMessage = 'Số điện thoại không hợp lệ.';
    } else if (error.code === 'auth/too-many-requests') {
      errorMessage = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
    } else if (error.code === 'auth/captcha-check-failed') {
      errorMessage = 'Xác thực reCAPTCHA thất bại. Vui lòng thử lại.';
    } else if (error.code === 'auth/billing-not-enabled') {
      errorMessage = 'Billing chưa được kích hoạt. Vui lòng kích hoạt billing account trong Google Cloud Console.';
    } else if (error.code === 'auth/operation-not-allowed') {
      errorMessage = 'Phone Authentication chưa được bật. Vui lòng bật trong Firebase Console > Authentication > Sign-in method.';
    } else if (error.message?.includes('already been rendered')) {
      errorMessage = 'reCAPTCHA đã được khởi tạo. Vui lòng thử lại sau vài giây.';
      // Clear and reset reCAPTCHA
      if (recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
        } catch (clearError) {
          console.warn('[Firebase] Error clearing reCAPTCHA:', clearError);
        }
        recaptchaVerifier = null;
      }
    }
    
    // Clean up on error
    if (recaptchaVerifier) {
      try {
        recaptchaVerifier.clear();
      } catch (clearError) {
        console.warn('[Firebase] Error clearing reCAPTCHA:', clearError);
      }
      recaptchaVerifier = null;
    }
    
    // Create a new error with user-friendly message
    const friendlyError = new Error(errorMessage);
    (friendlyError as any).code = error.code;
    (friendlyError as any).originalError = error;
    throw friendlyError;
  }
};

// Verify OTP code
export const verifyOTP = async (confirmationResult: ConfirmationResult, code: string) => {
  try {
    const result = await confirmationResult.confirm(code);
    return result.user;
  } catch (error: any) {
    throw error;
  }
};

// Get Firebase ID token
export const getIdToken = async (): Promise<string | null> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      return null;
    }
    return await user.getIdToken();
  } catch (error: any) {
    console.error('Error getting ID token:', error);
    return null;
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await auth.signOut();
    // Clean up reCAPTCHA
    if (recaptchaVerifier) {
      recaptchaVerifier.clear();
      recaptchaVerifier = null;
    }
  } catch (error: any) {
    throw error;
  }
};

// Clean up reCAPTCHA
export const cleanupRecaptcha = (): void => {
  if (recaptchaVerifier) {
    recaptchaVerifier.clear();
    recaptchaVerifier = null;
  }
};

export default {
  auth,
  formatPhoneNumber,
  initializeRecaptcha,
  sendOTP,
  verifyOTP,
  getIdToken,
  signOut,
  cleanupRecaptcha,
};

