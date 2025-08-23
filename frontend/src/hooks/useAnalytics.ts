import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackPageView, trackEvent } from '@/lib/analytics'

// Hook to track page views automatically
export function usePageTracking() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname) {
      // Only track pathname for simplicity and to avoid SSR issues
      trackPageView(pathname)
    }
  }, [pathname])
}

// Hook for tracking custom events
export function useEventTracking() {
  const trackQuoteStep = (step: string, data?: Record<string, any>) => {
    trackEvent('quote_step_completed', 'quote_flow', step)
    if (data) {
      trackEvent('quote_data_updated', 'quote_flow', step, JSON.stringify(data).length)
    }
  }

  const trackUserInteraction = (action: string, element: string, page?: string) => {
    trackEvent(action, 'user_interaction', element)
    if (page) {
      trackEvent('page_engagement', 'engagement', page)
    }
  }

  const trackFormSubmission = (formType: string, success: boolean, data?: Record<string, any>) => {
    trackEvent(success ? 'form_submit_success' : 'form_submit_error', 'forms', formType)
    if (success && data) {
      trackEvent('conversion', 'forms', formType, data.value || 1)
    }
  }

  return {
    trackQuoteStep,
    trackUserInteraction,
    trackFormSubmission,
  }
}
