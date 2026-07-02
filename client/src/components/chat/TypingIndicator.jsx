/**
 * TypingIndicator.jsx
 * Animated "..." dots to indicate the AI is thinking / calling tools.
 */

export default function TypingIndicator({ toolName }) {
  return (
    <div className="flex items-end gap-2 mb-3">
      {/* AI avatar */}
      <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
        A
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        {toolName ? (
          <p className="text-xs text-amber-600 font-medium mb-1">
            🔍 Looking up {formatToolName(toolName)}...
          </p>
        ) : null}
        <div className="flex gap-1 items-center h-4">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

function formatToolName(name) {
  const map = {
    getRoomAvailability: 'room availability',
    getRoomDetails: 'room details',
    createRoomReservation: 'creating reservation',
    createRestaurantReservation: 'restaurant booking',
    createHallReservation: 'event hall booking',
    createPayment: 'payment',
    checkPaymentStatus: 'payment status',
    getUserProfile: 'your profile',
    getMyReservations: 'your reservations',
    getEventSpaces: 'event spaces',
  };
  return map[name] || name;
}
