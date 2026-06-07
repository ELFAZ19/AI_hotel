import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getAvailableRooms, getAllRooms, getRoomTypes } from '../../services/roomService';
import RoomCard from '../../components/rooms/RoomCard';
import SearchBar from '../../components/booking/SearchBar';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import { SearchX, Filter } from 'lucide-react';

export default function RoomsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const checkIn = searchParams.get('check_in');
  const checkOut = searchParams.get('check_out');
  const guests = searchParams.get('guests');
  const typeFilterId = searchParams.get('type');

  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [selectedTypes, setSelectedTypes] = useState(typeFilterId ? [Number(typeFilterId)] : []);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const res = await getRoomTypes();
        if (res.success) setRoomTypes(res.data);
      } catch (error) {
        console.error('Error fetching room types:', error);
      }
    };
    fetchTypes();
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      setLoading(true);
      try {
        let res;
        if (checkIn && checkOut) {
          // Date search
          res = await getAvailableRooms(checkIn, checkOut, guests);
        } else {
          // General listing
          res = await getAllRooms({ status: 'available' });
        }
        
        if (res.success) {
          setRooms(res.data);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, [checkIn, checkOut, guests]);

  const handleTypeToggle = (typeId) => {
    setSelectedTypes(prev => 
      prev.includes(typeId) ? prev.filter(id => id !== typeId) : [...prev, typeId]
    );
  };

  // Apply client-side filtering for room types
  const filteredRooms = rooms.filter(room => {
    if (selectedTypes.length === 0) return true;
    return selectedTypes.includes(room.room_type_id);
  });

  const isSearchMode = !!(checkIn && checkOut);

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search */}
        <div className="mb-10 animate-fade-in">
          <h1 className="font-serif text-4xl font-bold text-navy-900 mb-2">
            {isSearchMode ? 'Available Rooms' : 'Our Rooms & Suites'}
          </h1>
          <p className="text-gray-600 mb-8">
            {isSearchMode 
              ? `Showing availability from ${checkIn} to ${checkOut} for ${guests} guests.` 
              : 'Discover our thoughtfully designed accommodations.'}
          </p>
          
          <SearchBar compact />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <button 
            className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 font-medium text-navy-900 shadow-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4" /> Filters
          </button>

          {/* Sidebar Filters */}
          <aside className={`w-full lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm sticky top-28">
              <h3 className="font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4 text-gold-500" /> Filter Results
              </h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Room Type</h4>
                  <div className="space-y-2">
                    {roomTypes.map(type => (
                      <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          selectedTypes.includes(type.id) 
                            ? 'bg-gold-500 border-gold-500' 
                            : 'border-gray-300 group-hover:border-gold-500'
                        }`}>
                          {selectedTypes.includes(type.id) && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">{type.name}</span>
                        <input 
                          type="checkbox" 
                          className="hidden" 
                          checked={selectedTypes.includes(type.id)}
                          onChange={() => handleTypeToggle(type.id)}
                        />
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Room List */}
          <div className="flex-1">
            {loading ? (
              <div className="py-20">
                <LoadingSpinner size="lg" className="mx-auto" />
              </div>
            ) : filteredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
                {filteredRooms.map(room => (
                  <RoomCard key={room.id} room={room} />
                ))}
              </div>
            ) : (
              <EmptyState 
                icon={SearchX}
                title="No rooms found" 
                description="We couldn't find any rooms matching your current criteria. Try adjusting your dates or filters."
                action={
                  <button 
                    onClick={() => {
                      setSelectedTypes([]);
                      setSearchParams({}); // Clear dates
                    }}
                    className="px-4 py-2 text-sm font-medium text-gold-600 bg-gold-50 rounded-lg hover:bg-gold-100 transition-colors"
                  >
                    Clear all filters
                  </button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
