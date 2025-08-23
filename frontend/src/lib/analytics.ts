// Google Analytics configuration and utility functions

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void
    dataLayer?: any[]
  }
}

// Google Analytics Measurement ID
// Stream Name: www.nestup.space
// Stream URL: www.nestup.space  
// Stream ID: 11853926411
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || 'G-SLFMLXSN7M'

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    })
  }
}

// Track page views
export const trackPageView = (url: string) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export const trackEvent = (
  action: string,
  category: string,
  label?: string,
  value?: number
) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Track conversion events
export const trackConversion = (eventName: string, parameters?: Record<string, any>) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function' && GA_MEASUREMENT_ID) {
    window.gtag('event', eventName, {
      send_to: GA_MEASUREMENT_ID,
      ...parameters,
    })
  }
}

// Track quote form submissions
export const trackQuoteSubmission = (formData: {
  society?: string
  floorPlan?: string
  design?: string
  totalAmount?: number
}) => {
  trackEvent('form_submit', 'quote', 'quote_summary', formData.totalAmount)
  trackConversion('generate_lead', {
    value: formData.totalAmount,
    currency: 'INR',
    event_label: 'quote_form',
  })
}

// Track user engagement
export const trackEngagement = (action: string, page: string) => {
  trackEvent(action, 'engagement', page)
}
