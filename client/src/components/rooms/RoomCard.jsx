import { useNavigate, useSearchParams } from 'react-router-dom';
import { useBookingStore } from '../../store/bookingStore';
import AmenityBadge from './AmenityBadge';
import { BedDouble, Users, DoorOpen, ArrowRight, Ban } from 'lucide-react';

export default function RoomCard({ room }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSelectedRoom, setSearchParams: storeSetSearchParams } = useBookingStore();

  // Support both legacy individual room data and new summary data
  const isSummary = !!room.room_type_name && room.representative_room;
  
  const typeName = isSummary ? room.room_type_name : (room.type_name || room.room_type?.name || 'Room');
  const price = isSummary
    ? room.representative_room.effective_price || room.base_price
    : (room.price_override || room.base_price || room.room_type?.base_price || 0);
  const amenities = room.amenities || room.room_type?.amenities || [];
  const imageUrl = isSummary
    ? room.representative_room.primary_image_url
    : (room.primary_image_url || room.image_url);
  const maxGuests = room.max_guests || room.room_type?.max_guests || 2;
  const totalCount = room.total_count;
  const availableCount = room.available_count;

  // The room id to navigate to
  const roomId = isSummary ? room.representative_room.id : room.id;
  const isAvailable = isSummary ? availableCount > 0 : room.status === 'available';

  const handleViewDetails = () => {
    navigate(`/rooms/${roomId}`);
  };

  const handleBook = () => {
    // Read dates from URL params (set by SearchBar)
    const urlCheckIn  = searchParams.get('check_in');
    const urlCheckOut = searchParams.get('check_out');
    const urlGuests   = searchParams.get('guests');

    if (isSummary) {
      setSelectedRoom({
        id: room.representative_room.id,
        room_number: room.representative_room.room_number,
        floor: room.representative_room.floor,
        effective_price: price,
        base_price: room.base_price,
        room_type_name: typeName,
        max_guests: maxGuests,
        amenities,
        primary_image_url: imageUrl,
        status: room.representative_room.status,
      });
    } else {
      setSelectedRoom(room);
    }

    // Store dates from URL into booking store if present.
    // Parse as local-time by appending T00:00:00 — bare "YYYY-MM-DD" strings are
    // treated as UTC by the Date constructor, which shifts the day backward in
    // timezones behind UTC (e.g. Africa/Addis_Ababa is UTC+3) and can make
    // check_out equal check_in after format(), causing the server to reject with 400.
    if (urlCheckIn && urlCheckOut) {
      storeSetSearchParams(
        new Date(`${urlCheckIn}T00:00:00`),
        new Date(`${urlCheckOut}T00:00:00`),
        urlGuests ? Number(urlGuests) : 1
      );
    }

    navigate('/booking');
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col">
      {/* Image */}
      <div className="relative h-52 bg-gradient-to-br from-navy-100 to-navy-200 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={typeName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BedDouble className="w-16 h-16 text-navy-300" />
          </div>
        )}

        {/* Availability Badge */}
        {isSummary ? (
          <div className={`absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 ${
            availableCount > 0
              ? 'bg-emerald-500/90 text-white'
              : 'bg-red-500/90 text-white'
          }`}>
            {availableCount > 0 ? (
              <>
                <DoorOpen className="w-3.5 h-3.5" />
                {availableCount} of {totalCount} Available
              </>
            ) : (
              <>
                <Ban className="w-3.5 h-3.5" />
                All Reserved
              </>
            )}
          </div>
        ) : (
          <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium ${
            room.status === 'available'
              ? 'bg-emerald-500/90 text-white'
              : room.status === 'maintenance'
              ? 'bg-amber-500/90 text-white'
              : 'bg-gray-500/90 text-white'
          }`}>
            {room.status}
          </div>
        )}

        {/* Price Tag */}
        <div className="absolute bottom-3 left-3 glass-dark rounded-lg px-3 py-1.5">
          <span className="text-white font-bold text-lg">
            ETB {Number(price).toLocaleString()}
          </span>
          <span className="text-gray-300 text-xs"> / night</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-serif text-lg font-semibold text-navy-900">{typeName}</h3>
            {room.description && (
              <p className="text-sm text-gray-500 line-clamp-2 mt-1">{room.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Up to {maxGuests} guests
          </span>
          {isSummary && (
            <span className="flex items-center gap-1">
              <DoorOpen className="w-3.5 h-3.5" /> {totalCount} rooms total
            </span>
          )}
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
            onClick={handleViewDetails}
            disabled={!isAvailable}
            className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
              isAvailable
                ? 'text-navy-700 bg-gray-100 hover:bg-gray-200'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed'
            }`}
          >
            {isAvailable ? 'View Details' : 'All Reserved'}
          </button>
          {isAvailable && (
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
