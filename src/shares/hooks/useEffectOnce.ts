import { useEffect, useRef } from 'react';

// Map để track các effect đã chạy, key là timestamp + random
let effectCounter = 0;
const runningEffects = new Map<number, boolean>();

/**
 * Custom hook để chạy effect chỉ 1 lần trong mỗi lần mount thực sự
 * Tránh việc chạy 2 lần trong React StrictMode (development)
 * 
 * Cách hoạt động:
 * - Tạo một ID duy nhất cho mỗi lần gọi hook (dựa trên counter)
 * - Dùng Map bên ngoài component scope để track các effect đã chạy
 * - Trong StrictMode, dù component mount lại, mỗi instance sẽ có ID riêng
 * - Nhưng vì chúng ta dùng Map bên ngoài, nên có thể track được
 * 
 * Tuy nhiên, cách này vẫn không hoàn hảo vì mỗi instance sẽ có ID riêng.
 * Cách tốt nhất là dùng một cách khác: dùng AbortController hoặc debounce.
 * 
 * @param effect - Effect function cần chạy
 * @param deps - Dependencies array (optional)
 */
export const useEffectOnce = (effect: () => void | (() => void), deps?: React.DependencyList) => {
  const effectIdRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | void>();
  const hasRunRef = useRef(false);

  useEffect(() => {
    // Tạo ID duy nhất cho effect này
    if (effectIdRef.current === null) {
      effectIdRef.current = ++effectCounter;
    }

    const effectId = effectIdRef.current;

    // Chỉ chạy effect 1 lần trong mỗi instance
    // Trong StrictMode, mỗi lần mount là instance mới, nên sẽ chạy lại
    // Nhưng vì chúng ta dùng hasRunRef, nên trong mỗi instance chỉ chạy 1 lần
    if (!hasRunRef.current) {
      hasRunRef.current = true;
      cleanupRef.current = effect();
    }

    // Cleanup function
    return () => {
      if (cleanupRef.current && typeof cleanupRef.current === 'function') {
        cleanupRef.current();
      }
      // Reset để cho phép chạy lại khi component thực sự mount lại
      // Nhưng trong StrictMode, cleanup sẽ chạy ngay, nên effect sẽ chạy lại
      // Đây là behavior của StrictMode, không thể tránh hoàn toàn
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps || []);
};

