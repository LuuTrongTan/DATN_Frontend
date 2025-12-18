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

/**
 * Debug flag (Vite):
 * - Set `VITE_FIREBASE_DEBUG=true` trong `.env.*` để bật intercept fetch và log chi tiết khi gửi OTP
 * - Mặc định: tắt để tránh side-effect (đặc biệt ở production)
 */
const FIREBASE_DEBUG = import.meta.env.DEV && import.meta.env.VITE_FIREBASE_DEBUG === 'true';

// Debug helpers (no-op khi không bật)
const debugLog = (...args: any[]) => {
  if (FIREBASE_DEBUG) console.log(...args);
};
const debugWarn = (...args: any[]) => {
  if (FIREBASE_DEBUG) console.warn(...args);
};

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
  let container = document.getElementById(containerId);
  // Nếu container chưa tồn tại (hoặc đã bị unmount), tạo tạm vào cuối body để tránh lỗi null trong script reCAPTCHA
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.minHeight = '78px';
    container.style.display = 'block';
    container.style.visibility = 'visible';
    document.body.appendChild(container);
  }

  if (recaptchaVerifier) {
    try {
      // Check container exists before clearing
      const existingContainer = document.getElementById(containerId);
      if (existingContainer) {
        recaptchaVerifier.clear();
      }
    } catch (error) {
      // Ignore errors during cleanup
      debugWarn('[Firebase] Error clearing existing reCAPTCHA:', error);
    }
    recaptchaVerifier = null;
  }

  // Safe wrapper for expired callback to prevent null access
  const safeExpiredCallback = () => {
    try {
      const containerElement = document.getElementById(containerId);
      if (recaptchaVerifier && containerElement) {
        recaptchaVerifier.clear();
      }
      recaptchaVerifier = null;
    } catch (error) {
      // Ignore errors - element may have been removed
      debugWarn('[Firebase] Error in expired callback:', error);
      recaptchaVerifier = null;
    }
  };

  recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
    size: 'normal',
    callback: () => {
      // Success callback - do nothing
    },
    'expired-callback': safeExpiredCallback,
  });

  return recaptchaVerifier;
};

// Send OTP via Firebase Phone Auth
export const sendOTP = async (phoneNumber: string): Promise<ConfirmationResult> => {
  // Format phone number outside try block so it's available in catch
  const formattedPhone = formatPhoneNumber(phoneNumber);
  
  // Store server response for error diagnosis
  let serverResponse: any = null;
  
  // Log Firebase config for debugging
  debugLog('[Firebase] Current Firebase config:', {
    apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 20)}...` : 'MISSING',
    authDomain: firebaseConfig.authDomain || 'MISSING',
    projectId: firebaseConfig.projectId || 'MISSING',
    hasAllConfig: !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId),
  });
  
  try {
    debugLog('[Firebase] ===== STARTING OTP SEND PROCESS =====');
    debugLog('[Firebase] Phone number:', formattedPhone);
    debugLog('[Firebase] Original phone:', phoneNumber);
    
    // Check if container exists in DOM
    const containerId = 'recaptcha-container';
    const containerElement = document.getElementById(containerId);
    debugLog('[Firebase] Checking reCAPTCHA container:', {
      containerId,
      exists: !!containerElement,
      parentElement: containerElement?.parentElement?.tagName || 'N/A',
      isVisible: containerElement ? window.getComputedStyle(containerElement).display !== 'none' : false,
    });
    
    if (!containerElement) {
      console.error('[Firebase] ❌ CRITICAL: reCAPTCHA container not found in DOM!');
      console.error('[Firebase] Container ID:', containerId);
      console.error('[Firebase] Available elements with id:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
      throw new Error(`reCAPTCHA container với id "${containerId}" không tồn tại trong DOM. Vui lòng đảm bảo có <div id="${containerId}"></div> trong component.`);
    }
    
    // Clean up existing reCAPTCHA if it exists
    if (recaptchaVerifier) {
      try {
        debugLog('[Firebase] Cleaning up existing reCAPTCHA verifier...');
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
        debugLog('[Firebase] Existing reCAPTCHA cleared');
      } catch (clearError: any) {
        debugWarn('[Firebase] Error clearing existing reCAPTCHA:', clearError);
        recaptchaVerifier = null;
      }
    }
    
    // Initialize reCAPTCHA
    debugLog('[Firebase] Initializing reCAPTCHA verifier...');
    debugLog('[Firebase] Container element:', {
      id: containerElement.id,
      className: containerElement.className,
      innerHTML: containerElement.innerHTML.substring(0, 100),
    });
    
    try {
      recaptchaVerifier = initializeRecaptcha(containerId);
      debugLog('[Firebase] ✅ reCAPTCHA verifier initialized successfully');
      debugLog('[Firebase] reCAPTCHA verifier type:', recaptchaVerifier.constructor.name);
    } catch (initError: any) {
      console.error('[Firebase] ❌ Failed to initialize reCAPTCHA:', {
        error: initError.message,
        code: initError.code,
        stack: initError.stack,
      });
      throw initError;
    }

    // Verify container still exists and is visible before rendering
    const containerCheck = document.getElementById(containerId);
    if (!containerCheck) {
      throw new Error(`reCAPTCHA container "${containerId}" đã bị xóa khỏi DOM trước khi render`);
    }
    
    // Ensure container is visible
    const containerStyle = window.getComputedStyle(containerCheck);
    if (containerStyle.display === 'none' || containerStyle.visibility === 'hidden') {
      debugWarn('[Firebase] ⚠️ Container is hidden, making it visible...');
      containerCheck.style.display = 'block';
      containerCheck.style.visibility = 'visible';
    }
    
    // Render reCAPTCHA - BẮT BUỘC phải render trước khi gọi signInWithPhoneNumber
    debugLog('[Firebase] Rendering reCAPTCHA...');
    debugLog('[Firebase] Container before render:', {
      exists: !!containerCheck,
      id: containerCheck.id,
      tagName: containerCheck.tagName,
      innerHTML: containerCheck.innerHTML.substring(0, 100),
      display: window.getComputedStyle(containerCheck).display,
      visibility: window.getComputedStyle(containerCheck).visibility,
      height: containerCheck.offsetHeight,
      width: containerCheck.offsetWidth,
    });
    
    try {
      // Render reCAPTCHA - this will inject the widget into the container
      const recaptchaWidgetId = await recaptchaVerifier.render();
      debugLog('[Firebase] ✅ reCAPTCHA rendered successfully');
      debugLog('[Firebase] reCAPTCHA widget ID:', recaptchaWidgetId);
      
      // Verify container still exists after render
      const containerAfterRender = document.getElementById(containerId);
      if (!containerAfterRender) {
        console.error('[Firebase] ❌ Container disappeared after render!');
        throw new Error('reCAPTCHA container đã bị xóa sau khi render');
      }
      
      debugLog('[Firebase] Container after render:', {
        exists: !!containerAfterRender,
        innerHTML: containerAfterRender.innerHTML.substring(0, 200),
        hasIframe: containerAfterRender.querySelector('iframe') !== null,
      });
      
      // Wait a bit for reCAPTCHA to fully initialize
      debugLog('[Firebase] Waiting for reCAPTCHA to initialize...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Final check
      const finalContainer = document.getElementById(containerId);
      if (!finalContainer) {
        throw new Error('reCAPTCHA container đã bị xóa sau khi initialize');
      }
      
      debugLog('[Firebase] ✅ reCAPTCHA fully initialized');
      
    } catch (renderError: any) {
      console.error('[Firebase] ❌ Failed to render reCAPTCHA:', {
        error: renderError.message,
        code: renderError.code,
        name: renderError.name,
        stack: renderError.stack,
      });
      
      // Check if container still exists
      const containerAfterError = document.getElementById(containerId);
      console.error('[Firebase] Container after render error:', {
        exists: !!containerAfterError,
        innerHTML: containerAfterError?.innerHTML.substring(0, 100) || 'N/A',
      });
      
      // Nếu đã render rồi thì OK
      if (renderError.message?.includes('already been rendered') || 
          renderError.message?.includes('already rendered') ||
          renderError.code === 'auth/recaptcha-already-rendered') {
        debugLog('[Firebase] ⚠️ reCAPTCHA already rendered, continuing...');
      } else {
        // Re-throw with more context
        throw new Error(`Không thể render reCAPTCHA: ${renderError.message}. Container exists: ${!!containerAfterError}`);
      }
    }

    // Verify reCAPTCHA verifier is ready
    if (!recaptchaVerifier) {
      throw new Error('reCAPTCHA verifier không tồn tại sau khi initialize');
    }
    
    debugLog('[Firebase] reCAPTCHA verifier ready:', {
      exists: !!recaptchaVerifier,
      containerId,
      type: typeof recaptchaVerifier,
    });

    // Send OTP
    debugLog('[Firebase] ===== CALLING signInWithPhoneNumber =====');
    debugLog('[Firebase] Parameters:', {
      phone: formattedPhone,
      hasRecaptchaVerifier: !!recaptchaVerifier,
      recaptchaType: recaptchaVerifier?.constructor?.name || 'unknown',
      authApp: auth.app.name,
      authConfig: {
        apiKey: auth.config.apiKey ? `${auth.config.apiKey.substring(0, 20)}...` : 'MISSING',
        authDomain: auth.config.authDomain || 'MISSING',
        projectId: firebaseConfig.projectId || 'MISSING',
      },
    });
    
    // Intercept fetch to see actual server response (DEBUG ONLY)
    const shouldInterceptFetch = FIREBASE_DEBUG;
    if (shouldInterceptFetch) {
      window.fetch = async (...args) => {
        const url = args[0]?.toString() || '';
        const response = await originalFetch(...args);

        // Log all Firebase-related requests
        if (
          url.includes('identitytoolkit') ||
          url.includes('sendVerificationCode') ||
          url.includes('accounts:sendVerificationCode')
        ) {
          const clonedResponse = response.clone();
          try {
            serverResponse = await clonedResponse.json();
            console.error('[Firebase] ===== SERVER RESPONSE DETAILS =====');
            console.error('[Firebase] Request URL:', url);
            console.error('[Firebase] Response status:', response.status);
            console.error('[Firebase] Full response:', JSON.stringify(serverResponse, null, 2));
            if (serverResponse.error) {
              console.error('[Firebase] Error code:', serverResponse.error.code);
              console.error('[Firebase] Error message:', serverResponse.error.message);
              console.error('[Firebase] Error status:', serverResponse.error.status);
              if (serverResponse.error.errors) {
                console.error(
                  '[Firebase] Error details:',
                  JSON.stringify(serverResponse.error.errors, null, 2)
                );
              }
            }
            console.error('[Firebase] ====================================');
          } catch (e) {
            console.error('[Firebase] Could not parse server response:', e);
            const text = await clonedResponse.text();
            console.error('[Firebase] Raw response:', text.substring(0, 500));
          }
        }
        return response;
      };
    }
    
    debugLog('[Firebase] Executing signInWithPhoneNumber...');
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier!);
    
    // Restore original fetch (if intercepted)
    if (shouldInterceptFetch && window.fetch !== originalFetch) {
      window.fetch = originalFetch;
    }
    
    debugLog('[Firebase] OTP sent successfully');
    
    // Delay cleanup to allow reCAPTCHA script to finish its operations
    // This prevents "Cannot read properties of null" errors
    setTimeout(() => {
      try {
        const containerElement = document.getElementById(containerId);
        if (containerElement && recaptchaVerifier) {
          // Only clear if container still exists and verifier is still active
          // Don't clear immediately to avoid race conditions with reCAPTCHA script
        }
      } catch (error) {
        // Ignore - element may have been removed
        debugWarn('[Firebase] Error in post-send cleanup:', error);
      }
    }, 2000); // Wait 2 seconds for reCAPTCHA script to finish
    
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
      console.error('[Firebase] 1. Firebase Config Check:');
      console.error('[Firebase]    - API Key:', firebaseConfig.apiKey ? `EXISTS (${firebaseConfig.apiKey.substring(0, 20)}...)` : '❌ MISSING');
      console.error('[Firebase]    - Auth Domain:', firebaseConfig.authDomain || '❌ MISSING');
      console.error('[Firebase]    - Project ID:', firebaseConfig.projectId || '❌ MISSING');
      console.error('[Firebase]    - Storage Bucket:', firebaseConfig.storageBucket || '❌ MISSING');
      console.error('[Firebase]    - Messaging Sender ID:', firebaseConfig.messagingSenderId || '❌ MISSING');
      console.error('[Firebase]    - App ID:', firebaseConfig.appId || '❌ MISSING');
      console.error('[Firebase]    - Full config valid:', !!(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId));
      
      console.error('[Firebase] 2. reCAPTCHA Status:');
      console.error('[Firebase]    - Verifier exists:', !!recaptchaVerifier);
      console.error('[Firebase]    - Container exists:', !!document.getElementById('recaptcha-container'));
      console.error('[Firebase]    - Container visible:', document.getElementById('recaptcha-container') ? 
        window.getComputedStyle(document.getElementById('recaptcha-container')!).display !== 'none' : false);
      
      console.error('[Firebase] 3. Current Domain:');
      console.error('[Firebase]    - Hostname:', window.location.hostname);
      console.error('[Firebase]    - Origin:', window.location.origin);
      console.error('[Firebase]    - Protocol:', window.location.protocol);
      
      console.error('[Firebase] 4. Server Response:');
      console.error('[Firebase]    - Full response:', JSON.stringify(serverResponse, null, 2));
      if (serverResponse?.error) {
        console.error('[Firebase]    - Error code:', serverResponse.error.code);
        console.error('[Firebase]    - Error message:', serverResponse.error.message);
        console.error('[Firebase]    - Error status:', serverResponse.error.status);
        if (serverResponse.error.details) {
          console.error('[Firebase]    - Error details:', JSON.stringify(serverResponse.error.details, null, 2));
        }
      }
      
      console.error('[Firebase] 5. CHECKLIST - Kiểm tra các bước sau (QUAN TRỌNG):');
      console.error('[Firebase]    ⚠️ a) Firebase Console > Authentication > Sign-in method > Phone > Enabled');
      console.error('[Firebase]    ⚠️ b) Firebase Console > Project Settings > Authorized domains > Thêm domain:', window.location.hostname);
      console.error('[Firebase]    ⚠️ c) Google Cloud Console > APIs & Services > Enabled APIs > Enable "Identity Toolkit API"');
      console.error('[Firebase]    ⚠️ d) Google Cloud Console > APIs & Services > Credentials > Mở API Key > Application restrictions:');
      console.error('[Firebase]       - Nếu set "HTTP referrers", thêm:', `http://${window.location.hostname}:*`, `https://${window.location.hostname}:*`);
      console.error('[Firebase]       - Hoặc tạm thời set "None" để test');
      console.error('[Firebase]    ⚠️ e) Google Cloud Console > APIs & Services > Credentials > Mở API Key > API restrictions:');
      console.error('[Firebase]       - Đảm bảo "Identity Toolkit API" được allow');
      console.error('[Firebase]       - Hoặc tạm thời set "Don\'t restrict" để test');
      console.error('[Firebase]    ✅ f) reCAPTCHA đã được render thành công (đã xác nhận)');
      console.error('[Firebase]    ⚠️ g) Billing account đã được enable (nếu vượt free tier)');
      console.error('[Firebase]');
      console.error('[Firebase] 🔍 NGUYÊN NHÂN THƯỜNG GẶP NHẤT:');
      console.error('[Firebase]    1. Domain chưa được authorize trong Firebase Console');
      console.error('[Firebase]    2. API Key bị restrict trong Google Cloud Console');
      console.error('[Firebase]    3. Identity Toolkit API chưa được enable');
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
      // Clear and reset reCAPTCHA with safety checks
      if (recaptchaVerifier) {
        try {
          const containerId = 'recaptcha-container';
          const containerElement = document.getElementById(containerId);
          if (containerElement) {
            recaptchaVerifier.clear();
          }
        } catch (clearError) {
          debugWarn('[Firebase] Error clearing reCAPTCHA:', clearError);
        }
        recaptchaVerifier = null;
      }
    }
    
    // Clean up on error - with safety checks
    if (recaptchaVerifier) {
      try {
        const containerId = 'recaptcha-container';
        const containerElement = document.getElementById(containerId);
        if (containerElement) {
          recaptchaVerifier.clear();
        }
      } catch (clearError) {
        debugWarn('[Firebase] Error clearing reCAPTCHA:', clearError);
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
    // Clean up reCAPTCHA with safety checks
    if (recaptchaVerifier) {
      try {
        const containerId = 'recaptcha-container';
        const containerElement = document.getElementById(containerId);
        if (containerElement) {
          recaptchaVerifier.clear();
        }
      } catch (error) {
        debugWarn('[Firebase] Error clearing reCAPTCHA on sign out:', error);
      }
      recaptchaVerifier = null;
    }
  } catch (error: any) {
    throw error;
  }
};

// Clean up reCAPTCHA with safety checks
export const cleanupRecaptcha = (): void => {
  if (recaptchaVerifier) {
    try {
      const containerId = 'recaptcha-container';
      const containerElement = document.getElementById(containerId);
      // Only clear if container exists to prevent null access errors
      if (containerElement) {
        recaptchaVerifier.clear();
      }
    } catch (error) {
      // Ignore errors during cleanup
      debugWarn('[Firebase] Error in cleanupRecaptcha:', error);
    }
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


