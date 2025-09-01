// Custom PostHog hook for SnappyLearn
import { useEffect, useRef } from 'react';
import posthog from 'posthog-js';

export function usePostHog() {
  const postHogRef = useRef(posthog);
  
  useEffect(() => {
    // Ensure PostHog is initialized
    if (!postHogRef.current) {
      postHogRef.current = posthog;
    }
  }, []);

  return postHogRef.current;
}

// Hook for tracking page views
export function usePageView(pageName: string) {
  const posthog = usePostHog();
  
  useEffect(() => {
    if (posthog) {
      posthog.capture('page_view', {
        page_name: pageName,
        path: window.location.pathname,
      });
    }
  }, [posthog, pageName]);
}

// Hook for tracking user actions
export function useTrackAction() {
  const posthog = usePostHog();
  
  return (action: string, properties?: any) => {
    if (posthog) {
      posthog.capture(action, properties);
    }
  };
}