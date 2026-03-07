'use client'

import { Suspense, useEffect } from 'react'
import { usePageTracking } from '@/hooks/useAnalytics'

function PageTracker() {
  usePageTracking()
  return null
}

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
      console.log('Google Analytics initialized')
    }
  }, [])

  return (
    <>
      <Suspense fallback={null}>
        <PageTracker />
      </Suspense>
      {children}
    </>
  )
}
