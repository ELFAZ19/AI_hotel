import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../store/bookingStore';
import BookingWizard from '../../components/booking/BookingWizard';

export default function BookingPage() {
  const navigate = useNavigate();
  const { selectedRoom } = useBookingStore();

  useEffect(() => {
    // If user navigates directly to /booking without selecting a room
    if (!selectedRoom) {
      navigate('/rooms');
    }
  }, [selectedRoom, navigate]);

  if (!selectedRoom) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="font-serif text-4xl font-bold text-navy-900 mb-3">Complete Your Booking</h1>
          <p className="text-gray-600">You're just a few steps away from securing your stay.</p>
        </div>

        <BookingWizard />

      </div>
    </div>
  );
}
