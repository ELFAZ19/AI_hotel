import { useNavigate } from 'react-router-dom';
import { useBookingStore } from '../../store/bookingStore';
import AmenityBadge from './AmenityBadge';
import { BedDouble, Users, MapPin, ArrowRight } from 'lucide-react';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const setSelectedRoom = useBookingStore((s) => s.setSelectedRoom);

  const price = room.price_override || room.base_price || room.room_type?.base_price || 0;
  const amenities = room.amenities || room.room_type?.amenities || [];
  const typeName = room.type_name || room.room_type?.name || 'Room';
  const imageUrl = room.primary_image_url || room.image_url;

  const handleBook = () => {
    setSelectedRoom(room);
    navigate('/booking');
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
      {/* Image */}
      <div className="relative h-52 bg-gradient-to-br from-navy-100 to-navy-200 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${typeName} - Room ${room.room_number}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-16 h-16 text-navy-300" />
          </div>
        )}
        {/* Status Badge */}
        <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${
          room.status === 'available'
            ? 'bg-emerald-500/90 text-white'
            : room.status === 'maintenance'
            ? 'bg-amber-500/90 text-white'
            : 'bg-gray-500/90 text-white'
        }`}>
          {room.status}
        </div>
        {/* Price Tag */}
        <div className="absolute bottom-3 left-3 glass-dark rounded-lg px-3 py-1.5">
          <span className="text-white font-bold text-lg">
            ETB {price.toLocaleString()}
          </span>
          <span className="text-gray-300 text-xs"> / night</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-serif text-lg font-semibold text-navy-900">{typeName}</h3>
            <p className="text-sm text-gray-500">Room {room.room_number}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> Floor {room.floor}
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {room.max_guests || room.room_type?.max_guests || 2} guests
          </span>
        </div>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {amenities.slice(0, 4).map((a) => (
            <AmenityBadge key={a} amenity={a} />
          ))}
          {amenities.length > 4 && (
            <span className="text-xs text-gray-400 self-center">+{amenities.length - 4} more</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2">
          <button
            onClick={() => navigate(`/rooms/${room.id}`)}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-navy-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            View Details
          </button>
          {room.status === 'available' && (
            <button
              onClick={handleBook}
              className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-navy-900 bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors shadow-sm"
            >
              Book Now <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
