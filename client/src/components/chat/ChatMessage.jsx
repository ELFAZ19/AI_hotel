/**
 * ChatMessage.jsx
 * Renders a single chat message bubble (user or assistant).
 * Uses ReactMarkdown with custom component overrides (no @tailwindcss/typography needed).
 */

import ReactMarkdown from 'react-markdown';

const formatTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Custom renderers so markdown looks good without the prose plugin
const markdownComponents = {
  p:      ({ children }) => <p className="mb-1.5 last:mb-0">{children}</p>,
  ul:     ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
  li:     ({ children }) => <li className="text-sm">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  h1:     ({ children }) => <h1 className="text-base font-bold mb-1">{children}</h1>,
  h2:     ({ children }) => <h2 className="text-sm font-bold mb-1">{children}</h2>,
  h3:     ({ children }) => <h3 className="text-sm font-semibold mb-0.5">{children}</h3>,
  code:   ({ children }) => (
    <code className="bg-gray-100 text-amber-700 px-1 py-0.5 rounded text-xs font-mono">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-amber-400 pl-3 italic text-gray-600 my-1">
      {children}
    </blockquote>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer"
       className="text-amber-600 underline hover:text-amber-800">
      {children}
    </a>
  ),
};

export default function ChatMessage({ role, content, timestamp, isStreaming }) {
  const isUser = role === 'user';

  return (
    <div className={`flex items-end gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      {/* AI avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 mb-1">
          A
        </div>
      )}

      {/* Bubble */}
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isUser
            ? 'bg-amber-600 text-white rounded-br-sm'
            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-sm'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap break-words">{content}</p>
        ) : (
          <div className="text-sm">
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse ml-0.5 align-middle rounded-sm" />
            )}
          </div>
        )}
        {timestamp && (
          <p className={`text-[10px] mt-1 ${isUser ? 'text-amber-100 text-right' : 'text-gray-400'}`}>
            {formatTime(timestamp)}
          </p>
        )}
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold flex-shrink-0 mb-1">
          U
        </div>
      )}
    </div>
  );
}
