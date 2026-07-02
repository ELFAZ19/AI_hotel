/**
 * ChatPaymentButton.jsx
 * Displayed inside the chat when the AI returns a Chapa payment link.
 * Extracted from assistant message content by pattern matching.
 */

import { ExternalLink, CreditCard } from 'lucide-react';

export default function ChatPaymentButton({ url, amount }) {
  return (
    <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="flex items-center gap-2 mb-2">
        <CreditCard size={16} className="text-amber-600" />
        <span className="text-sm font-semibold text-amber-800">
          Complete Payment {amount ? `— ${Number(amount).toLocaleString()} ETB` : ''}
        </span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        Pay with Chapa
        <ExternalLink size={14} />
      </a>
    </div>
  );
}
