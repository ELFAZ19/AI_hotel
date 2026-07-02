import { useBookingStore } from '../../store/bookingStore';
import { differenceInDays, format } from 'date-fns';
import { Calendar, Users, MapPin } from 'lucide-react';

export default function StepSelectRoom({ onNext }) {
  const { selectedRoom, checkIn, checkOut, guests } = useBookingStore();

  if (!selectedRoom) return null;

  // Normalize to Date objects (store persists as ISO strings)
  const checkInDate = checkIn ? (checkIn instanceof Date ? checkIn : new Date(checkIn)) : null;
  const checkOutDate = checkOut ? (checkOut instanceof Date ? checkOut : new Date(checkOut)) : null;

  // Validate parsed dates
  const datesValid = checkInDate && checkOutDate
    && !isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime());

  const nights = datesValid ? differenceInDays(checkOutDate, checkInDate) : 0;
  const price = selectedRoom.price_override || selectedRoom.base_price || selectedRoom.room_type?.base_price || 0;
  const total = price * nights;
  const typeName = selectedRoom.type_name || selectedRoom.room_type?.name || 'Room';
  const imageUrl = selectedRoom.primary_image_url || selectedRoom.image_url;

  return (
    <div className="p-6 sm:p-8 animate-fade-in">
      <h2 className="text-2xl font-serif font-bold text-navy-900 mb-6">Review Your Selection</h2>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Room Image & Basic Info */}
        <div className="w-full md:w-1/2 lg:w-2/5 flex flex-col gap-4">
          <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100">
            {imageUrl && (
              <img src={imageUrl} alt={typeName} className="w-full h-full object-cover" />
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{typeName}</h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
              <MapPin className="w-4 h-4" /> Floor {selectedRoom.floor}, Room {selectedRoom.room_number}
            </p>
          </div>
        </div>

        {/* Booking Details & Summary */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-6 space-y-4">
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-100 flex items-center justify-center text-navy-700">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Dates</p>
                  <p className="text-sm font-medium text-navy-900">
                    {checkInDate ? format(checkInDate, 'MMM d, yyyy') : 'TBD'} — {checkOutDate ? format(checkOutDate, 'MMM d, yyyy') : 'TBD'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Duration</p>
                <p className="text-sm font-medium text-navy-900">{nights} {nights === 1 ? 'night' : 'nights'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center text-gold-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Guests</p>
                <p className="text-sm font-medium text-navy-900">{guests} {guests === 1 ? 'Guest' : 'Guests'}</p>
              </div>
            </div>
          </div>

          <div className="mt-auto space-y-3">
            <div className="flex justify-between items-end">
              <span className="text-gray-500">Total Price</span>
              <div className="text-right">
                <span className="text-sm text-gray-400 block line-through mb-0.5">ETB {(total * 1.1).toLocaleString()}</span>
                <span className="text-3xl font-bold text-navy-900">ETB {total.toLocaleString()}</span>
              </div>
            </div>
            
            <button
              onClick={onNext}
              disabled={!datesValid || nights <= 0}
              className="w-full h-12 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue to Guest Details
            </button>
            {(!datesValid) && (
              <p className="text-xs text-red-500 text-center">Please go back and select your check-in and check-out dates.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
