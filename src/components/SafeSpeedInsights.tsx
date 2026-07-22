'use client'

import { SpeedInsights } from "@vercel/speed-insights/next"
import { useEffect } from "react"

/**
 * Safe wrapper for Vercel SpeedInsights that prevents negative timestamp errors.
 * This component handles the case where SpeedInsights tries to measure performance
 * with invalid timestamps, particularly on pages that load very quickly.
 */
export function SafeSpeedInsights() {
  useEffect(() => {
    function isNegativeTimestampError(message: string): boolean {
      return message.includes("cannot have a negative time stamp")
        && message.includes("Failed to execute 'measure' on 'Performance'")
    }

    function onWindowError(event: ErrorEvent): void {
      const message = event.message || event.error?.message || ''
      if (!isNegativeTimestampError(message)) return

      // Suppress this known browser-side noise from third-party perf tooling.
      event.preventDefault()
      event.stopImmediatePropagation()
    }

    function onUnhandledRejection(event: PromiseRejectionEvent): void {
      const reasonMessage =
        typeof event.reason === 'string'
          ? event.reason
          : event.reason?.message || ''

      if (!isNegativeTimestampError(reasonMessage)) return

      event.preventDefault()
    }

    window.addEventListener('error', onWindowError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onWindowError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return <SpeedInsights />
}
