/**
 * Microsoft Clarity Analytics & Visual Heatmap Service
 * 100% Free, Zero-Cost User Session Recordings & Tap Heatmaps
 */

declare global {
  interface Window {
    clarity?: (...args: any[]) => void;
  }
}

let isInitialized = false;

export function initClarity(customProjectId?: string): void {
  if (typeof window === 'undefined' || isInitialized) return;

  const projectId =
    customProjectId ||
    (import.meta as any).env?.VITE_CLARITY_PROJECT_ID ||
    (window as any).CLARITY_PROJECT_ID ||
    window.localStorage?.getItem('swap_clarity_project_id');

  if (!projectId || typeof projectId !== 'string' || !projectId.trim()) {
    return;
  }

  try {
    (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      t = l.createElement(r);
      t.async = 1;
      t.src = 'https://www.clarity.ms/tag/' + i;
      y = l.getElementsByTagName(r)[0];
      y.parentNode.insertBefore(t, y);
    })(window, document, 'clarity', 'script', projectId.trim());

    isInitialized = true;
    console.log('⚡ Microsoft Clarity initialized for project:', projectId);
  } catch (err) {
    console.warn('Could not initialize Microsoft Clarity:', err);
  }
}

export function tagClarityUser(userHandle: string, email?: string): void {
  if (typeof window === 'undefined' || !window.clarity) return;
  try {
    window.clarity('identify', userHandle, userHandle, 'swap_session', userHandle);
    if (email) {
      window.clarity('set', 'user_email', email);
    }
  } catch {
    // Non-blocking
  }
}

export function tagClarityEvent(eventName: string): void {
  if (typeof window === 'undefined' || !window.clarity) return;
  try {
    window.clarity('event', eventName);
  } catch {
    // Non-blocking
  }
}
