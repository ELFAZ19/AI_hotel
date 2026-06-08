import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { getRoomById } from '../../services/roomService';
import { useBookingStore } from '../../store/bookingStore';
import RoomGallery from '../../components/rooms/RoomGallery';
import AmenityBadge from '../../components/rooms/AmenityBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { MapPin, Users, Calendar, ArrowRight } from 'lucide-react';

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setSelectedRoom, setSearchParams } = useBookingStore();
  
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Local booking state
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await getRoomById(id);
        if (res.success) {
          setRoom(res.data);
          // Set max guests based on room type
          const max = res.data.max_guests || res.data.room_type?.max_guests || 2;
          if (guests > max) setGuests(max);
        }
      } catch (error) {
        console.error('Failed to fetch room:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen pt-32 pb-16"><LoadingSpinner size="lg" className="mx-auto" /></div>;
  }

  if (!room) {
    return (
      <div className="min-h-screen pt-32 pb-16 flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold text-navy-900 mb-4">Room not found</h2>
        <button onClick={() => navigate('/rooms')} className="text-gold-600 hover:text-gold-700 font-medium">
          ← Back to Rooms
        </button>
      </div>
    );
  }

  const typeName = room.type_name || room.room_type?.name || 'Room';
  const description = room.description || room.room_type?.description || 'Experience ultimate comfort and luxury.';
  const amenities = room.amenities || room.room_type?.amenities || [];
  const price = room.price_override || room.base_price || room.room_type?.base_price || 0;
  const maxGuests = room.max_guests || room.room_type?.max_guests || 2;
  const allImages = room.images || [];
  if (room.primary_image_url && !allImages.find(i => i.image_url === room.primary_image_url)) {
    allImages.unshift({ image_url: room.primary_image_url });
  }

  const handleBookNow = () => {
    setSelectedRoom(room);
    if (checkIn && checkOut) {
      setSearchParams(checkIn, checkOut, guests);
    }
    navigate('/booking');
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Gallery */}
        <div className="mb-8">
          <button onClick={() => navigate('/rooms')} className="text-sm font-medium text-gray-500 hover:text-navy-900 mb-4 inline-block transition-colors">
            ← Back to Rooms
          </button>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
            <div>
              <h1 className="font-serif text-4xl font-bold text-navy-900 mb-2">{typeName}</h1>
              <p className="text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Floor {room.floor} • Up to {maxGuests} guests
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-navy-900">ETB {price.toLocaleString()}</span>
              <span className="text-gray-500"> / night</span>
            </div>
          </div>
          
          <RoomGallery images={allImages} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-navy-900 mb-4">About this room</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-line">{description}</p>
            </section>

            {/* Amenities */}
            <section className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm">
              <h3 className="font-serif text-2xl font-bold text-navy-900 mb-6">Room Amenities</h3>
              <div className="flex flex-wrap gap-3">
                {amenities.map(a => (
                  <AmenityBadge key={a} amenity={a} />
                ))}
              </div>
            </section>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl sticky top-28">
              <h3 className="font-serif text-xl font-bold text-navy-900 mb-6">Reserve this room</h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-in</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 z-10" />
                    <DatePicker
                      selected={checkIn}
                      onChange={(date) => {
                        setCheckIn(date);
                        if (checkOut && date >= checkOut) {
                          const nextDay = new Date(date);
                          nextDay.setDate(date.getDate() + 1);
                          setCheckOut(nextDay);
                        }
                      }}
                      selectsStart
                      startDate={checkIn}
                      endDate={checkOut}
                      minDate={new Date()}
                      placeholderText="Select date"
                      className="w-full h-12 pl-10 pr-3 rounded-lg border border-gray-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-sm font-medium"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Check-out</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 z-10" />
                    <DatePicker
                      selected={checkOut}
                      onChange={(date) => setCheckOut(date)}
                      selectsEnd
                      startDate={checkIn}
                      endDate={checkOut}
                      minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
                      placeholderText="Select date"
                      className="w-full h-12 pl-10 pr-3 rounded-lg border border-gray-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-sm font-medium"
                      dateFormat="MMM d, yyyy"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Guests</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-500 pointer-events-none" />
                    <select
                      value={guests}
                      onChange={(e) => setGuests(Number(e.target.value))}
                      className="w-full h-12 pl-10 pr-3 rounded-lg border border-gray-200 focus:border-gold-500 focus:ring-1 focus:ring-gold-500 text-sm font-medium appearance-none bg-white cursor-pointer"
                    >
                      {Array.from({ length: maxGuests }, (_, i) => i + 1).map((num) => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {room.status !== 'available' ? (
                <button disabled className="w-full h-14 bg-gray-200 text-gray-500 rounded-xl font-medium cursor-not-allowed">
                  Currently Unavailable
                </button>
              ) : (
                <button 
                  onClick={handleBookNow}
                  className="w-full h-14 bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-xl font-medium transition-colors shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
                >
                  Book Now <ArrowRight className="w-5 h-5" />
                </button>
              )}
              
              <p className="text-center text-xs text-gray-400 mt-4">You won't be charged yet</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
