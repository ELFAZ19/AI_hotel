import { useState } from 'react';
import { useBookingStore } from '../../store/bookingStore';
import { initiatePayment } from '../../services/paymentService';
import toast from 'react-hot-toast';
import { ShieldCheck, CreditCard } from 'lucide-react';

export default function StepPayment({ onBack }) {
  const { reservation } = useBookingStore();
  const [loading, setLoading] = useState(false);

  if (!reservation) return null;

  const handlePayment = async () => {
    setLoading(true);
    try {
      // initiatePayment requires reservationId and amount (total_price)
      const res = await initiatePayment(reservation.id, reservation.total_price);
      if (res.success && res.data?.checkoutUrl) {
        // Redirect to Chapa
        window.location.href = res.data.checkoutUrl;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 animate-fade-in text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-navy-50 text-navy-900 rounded-full flex items-center justify-center mx-auto mb-6">
        <CreditCard className="w-8 h-8" />
      </div>
      
      <h2 className="text-2xl font-serif font-bold text-navy-900 mb-2">Complete Payment</h2>
      <p className="text-gray-500 mb-8">
        Your reservation for <strong className="text-navy-900">ETB {Number(reservation.total_price).toLocaleString()}</strong> is pending. 
        Complete your payment securely via Chapa to confirm your booking.
      </p>

      <div className="space-y-4">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full h-14 bg-[#00A65A] hover:bg-[#008d4c] text-white font-medium rounded-xl transition-colors disabled:opacity-50 shadow-lg shadow-[#00A65A]/20 flex items-center justify-center gap-2"
        >
          {loading ? 'Processing...' : 'Pay with Chapa'}
        </button>
        
        <button
          onClick={onBack}
          disabled={loading}
          className="w-full h-12 text-sm font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors"
        >
          Back to Details
        </button>
      </div>

      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
        <ShieldCheck className="w-4 h-4" />
        <span>Secure encrypted payment by Chapa</span>
      </div>
    </div>
  );
}
