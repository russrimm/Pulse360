'use client';
import { useState, useRef, useEffect } from 'react';
import { CopilotStudioClient } from '@microsoft/agents-copilotstudio-client';

const CONNECTION_STRING = process.env.NEXT_PUBLIC_COPILOT_CONNECTION_STRING;

export default function AgentChatWidget() {
  const [minimized, setMinimized] = useState(true);
  const [messages, setMessages] = useState<{from: 'user'|'agent', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!client && CONNECTION_STRING) {
      try {
        setClient(new CopilotStudioClient(CONNECTION_STRING, {}));
      } catch {}
    }
  }, [client]);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!client || !input.trim()) return;
    setLoading(true);
    setMessages(msgs => [...msgs, { from: 'user', text: input }]);
    try {
      // SDK: sendActivity returns a response object
      const response = await client.sendActivity({ type: 'message', text: input });
      setMessages(msgs => [...msgs, { from: 'agent', text: response.text || '[No response]' }]);
    } catch (e) {
      setMessages(msgs => [...msgs, { from: 'agent', text: '[Error communicating with agent]' }]);
    }
    setInput('');
    setLoading(false);
  };

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
    );
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
      className="rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-lg flex flex-col"
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
      <div className="flex-1 flex flex-col p-3 overflow-y-auto" style={{ marginTop: 32, marginBottom: 48 }}>
        {messages.length === 0 && (
          <div className="text-gray-400 text-center mt-8">Start a conversation with Copilot Studio Agent…</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 text-sm ${msg.from === 'user' ? 'text-right' : 'text-left'}`}> 
            <span className={`inline-block px-3 py-2 rounded-lg ${msg.from === 'user' ? 'bg-primary-100 text-primary-900 dark:bg-primary-900 dark:text-primary-100' : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'}`}>{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="absolute bottom-0 left-0 w-full flex items-center p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <input
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Type your message…"
          disabled={loading}
        />
        <button
          className="ml-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
          onClick={sendMessage}
          disabled={loading || !input.trim()}
        >
          Send
        </button>
      </div>
    </div>
  );
} 