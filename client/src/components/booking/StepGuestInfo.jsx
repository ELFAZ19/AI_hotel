import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useBookingStore } from '../../store/bookingStore';
import { createReservation } from '../../services/reservationService';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function StepGuestInfo({ onNext, onBack }) {
  const { user } = useAuthStore();
  const { selectedRoom, checkIn, checkOut, guests, setReservation } = useBookingStore();
  
  const [specialRequests, setSpecialRequests] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        room_id: selectedRoom.id,
        check_in: format(checkIn, 'yyyy-MM-dd'),
        check_out: format(checkOut, 'yyyy-MM-dd'),
        adults: guests,
        children: 0,
        special_requests: specialRequests,
      };

      const res = await createReservation(data);
      if (res.success) {
        setReservation(res.data);
        onNext();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create reservation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 sm:p-8 animate-fade-in">
      <h2 className="text-2xl font-serif font-bold text-navy-900 mb-6">Guest Details</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
            <Input type="text" value={user?.firstName || ''} disabled className="bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
            <Input type="text" value={user?.lastName || ''} disabled className="bg-gray-50" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <Input type="email" value={user?.email || ''} disabled className="bg-gray-50" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Special Requests (Optional)</label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              rows={4}
              placeholder="E.g., early check-in, dietary requirements..."
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base placeholder:text-gray-400 focus:border-gold-500 focus:outline-none focus:ring-1 focus:ring-gold-500 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">We will do our best to accommodate your requests, subject to availability.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="px-6 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-2.5 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating Reservation...' : 'Proceed to Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}
