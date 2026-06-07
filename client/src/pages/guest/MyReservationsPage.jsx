import { useState, useEffect } from 'react';
import { getMyReservations, cancelReservation } from '../../services/reservationService';
import ReservationBadge from '../../components/dashboard/ReservationBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { format, differenceInDays } from 'date-fns';
import { CalendarRange, MapPin, BedDouble } from 'lucide-react';
import toast from 'react-hot-toast';

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedResId, setSelectedResId] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await getMyReservations();
      if (res.success) {
        setReservations(res.data);
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCancelClick = (id) => {
    setSelectedResId(id);
    setCancelModalOpen(true);
  };

  const executeCancel = async () => {
    setCancelling(true);
    try {
      const res = await cancelReservation(selectedResId, 'Cancelled by user');
      if (res.success) {
        toast.success('Reservation cancelled successfully');
        setCancelModalOpen(false);
        fetchReservations();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to cancel reservation');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-10 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-navy-900 mb-2">My Reservations</h1>
          <p className="text-gray-600">View and manage your upcoming and past stays.</p>
        </div>

        {loading ? (
          <div className="py-20"><LoadingSpinner size="lg" className="mx-auto" /></div>
        ) : reservations.length > 0 ? (
          <div className="space-y-6 animate-fade-in-up">
            {reservations.map((res) => {
              const checkIn = new Date(res.check_in);
              const checkOut = new Date(res.check_out);
              const nights = differenceInDays(checkOut, checkIn);
              const canCancel = ['pending', 'confirmed'].includes(res.status);

              return (
                <div key={res.id} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition-shadow">
                  
                  {/* Image */}
                  <div className="w-full md:w-48 h-32 bg-gray-100 rounded-xl flex-shrink-0 overflow-hidden">
                    {res.room?.primary_image_url ? (
                      <img src={res.room.primary_image_url} alt="Room" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <BedDouble className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-serif text-xl font-bold text-navy-900">
                          {res.room?.room_type?.name || 'Room'} {res.room?.room_number}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> Floor {res.room?.floor}
                        </p>
                      </div>
                      <ReservationBadge status={res.status} />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Check-in</p>
                        <p className="text-sm font-medium text-navy-900">{format(checkIn, 'MMM d, yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Check-out</p>
                        <p className="text-sm font-medium text-navy-900">{format(checkOut, 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="flex flex-col justify-between items-end min-w-[140px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 mt-4 md:mt-0">
                    <div className="text-right w-full mb-4 md:mb-0">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Total ({nights} nights)</p>
                      <p className="text-xl font-bold text-navy-900">ETB {Number(res.total_price).toLocaleString()}</p>
                    </div>

                    <div className="flex flex-col gap-2 w-full">
                      <button className="w-full px-4 py-2 text-sm font-medium text-navy-700 bg-navy-50 hover:bg-navy-100 rounded-lg transition-colors">
                        View Details
                      </button>
                      {canCancel && (
                        <button 
                          onClick={() => handleCancelClick(res.id)}
                          className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        >
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState 
            icon={CalendarRange}
            title="No reservations yet"
            description="You don't have any reservations history with us."
            action={
              <button 
                onClick={() => window.location.href = '/rooms'}
                className="px-6 py-2.5 bg-gold-500 hover:bg-gold-600 text-navy-900 font-medium rounded-xl transition-colors"
              >
                Browse Rooms
              </button>
            }
          />
        )}

      </div>

      <ConfirmDialog 
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        title="Cancel Reservation"
        description="Are you sure you want to cancel this reservation? This action cannot be undone."
        confirmLabel="Yes, Cancel Booking"
        loading={cancelling}
        onConfirm={executeCancel}
      />
    </div>
  );
}
