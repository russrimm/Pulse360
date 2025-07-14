'use client'

import { useEffect, useRef, useState } from 'react'

interface ReleasePlannerAgentChatProps {
  connectionString: string
  endpoint: string
}

// Copilot Studio agent webchat endpoint for reuse
export const COPILOT_AGENT_WEBCHAT_URL = "https://copilotstudio.preview.microsoft.com/environments/18571ae9-2db1-e2fc-97ef-2398a6944c06/bots/cr7d6_agent/webchat?__version__=2";

export function ReleasePlannerAgentChat() {
  const [minimized, setMinimized] = useState(false)

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 51,
          borderRadius: '9999px',
          width: 56,
          height: 56,
          boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
          background: 'white',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
        aria-label="Open chat agent"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600 dark:text-primary-400">
          <rect x="3" y="7" width="18" height="10" rx="2"/>
          <path d="M8 17v2a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2"/>
        </svg>
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 340,
        height: 420,
        zIndex: 50,
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        borderRadius: '1rem',
        overflow: 'hidden',
        background: 'white',
      }}
      className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg"
    >
      <button
        onClick={() => setMinimized(true)}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 51,
          borderRadius: '9999px',
          width: 32,
          height: 32,
          background: 'rgba(255,255,255,0.85)',
          border: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        className="shadow border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors"
        aria-label="Minimize chat agent"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
          <rect x="3" y="11" width="18" height="2" rx="1"/>
        </svg>
      </button>
      <iframe
        src="https://copilotstudio.preview.microsoft.com/environments/18571ae9-2db1-e2fc-97ef-2398a6944c06/bots/cr7d6_agent/webchat?__version__=2"
        frameBorder="0"
        style={{ width: '100%', height: '100%' }}
        title="Copilot Studio Agent Chat"
        allow="clipboard-write;"
      />
    </div>
  )
} 