import { useEffect, useRef, useCallback } from 'react';

const IDLE_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
const STORAGE_KEY = 'last_active_at';

/**
 * Auto-logout after a period of inactivity.
 * Tracks mouse, keyboard, touch, and scroll events.
 * Syncs across tabs via localStorage so any tab's activity resets the timer.
 *
 * @param timeoutMs - Inactivity timeout in milliseconds (default: 60 minutes)
 * @param onTimeout - Callback when timeout is reached (typically logout)
 * @param enabled - Whether to enable idle tracking (e.g., only when authenticated)
 */
export function useIdleTimeout(
  timeoutMs: number = 60 * 60 * 1000,
  onTimeout: () => void,
  enabled: boolean = true
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Update last active timestamp in localStorage (syncs across tabs)
    localStorage.setItem(STORAGE_KEY, Date.now().toString());

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onTimeoutRef.current();
    }, timeoutMs);
  }, [timeoutMs, enabled]);

  useEffect(() => {
    if (!enabled) return;

    // Check if already timed out (e.g., tab was closed and reopened)
    const lastActive = localStorage.getItem(STORAGE_KEY);
    if (lastActive) {
      const elapsed = Date.now() - parseInt(lastActive, 10);
      if (elapsed >= timeoutMs) {
        onTimeoutRef.current();
        return;
      }
    }

    // Start initial timer
    resetTimer();

    // Listen for user activity
    const handleActivity = () => resetTimer();
    IDLE_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }));

    // Listen for activity in other tabs via storage event
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        resetTimer();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      IDLE_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity));
      window.removeEventListener('storage', handleStorage);
    };
  }, [resetTimer, timeoutMs, enabled]);
}
