'use client'

import { usePageTracking } from '@/hooks/useAnalytics'
import { useEffect } from 'react'

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  // Track page views
  usePageTracking()

  // Initialize Google Analytics on component mount
  useEffect(() => {
    // The gtag function is already loaded in the layout
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      console.log('Google Analytics initialized')
    }
  }, [])

  return <>{children}</>
}
