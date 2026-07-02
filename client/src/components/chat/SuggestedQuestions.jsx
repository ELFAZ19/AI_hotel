/**
 * SuggestedQuestions.jsx
 * One-tap suggestion chips shown when the chat is empty / just opened.
 * Clicking a suggestion fires it as a user message.
 */

const SUGGESTIONS = [
  '🛏️ What rooms are available?',
  '💰 Show me room prices',
  '🍽️ Book a table for dinner',
  '🎪 What event halls do you have?',
  '📋 What is your cancellation policy?',
  '🅿️ Is parking available?',
  '📍 Where are you located?',
];

export default function SuggestedQuestions({ onSelect }) {
  return (
    <div className="px-3 pb-3">
      <p className="text-xs text-gray-400 mb-2 text-center">Try asking...</p>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {SUGGESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onSelect(q)}
            className="text-xs bg-white border border-amber-200 text-amber-700 hover:bg-amber-50 hover:border-amber-400 px-2.5 py-1.5 rounded-full transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}
