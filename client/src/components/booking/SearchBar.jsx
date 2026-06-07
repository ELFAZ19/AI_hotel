import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Users, Search } from 'lucide-react';

export default function SearchBar({ compact = false }) {
  const navigate = useNavigate();
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [guests, setGuests] = useState(1);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) return;
    
    const params = new URLSearchParams({
      check_in: format(checkIn, 'yyyy-MM-dd'),
      check_out: format(checkOut, 'yyyy-MM-dd'),
      guests: guests.toString(),
    });
    
    navigate(`/rooms?${params.toString()}`);
  };

  return (
    <div className={`bg-white p-2 rounded-2xl shadow-xl border border-gray-100 ${compact ? 'max-w-4xl' : 'max-w-5xl'} mx-auto`}>
      <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-2">
        {/* Check-in */}
        <div className="flex-1 w-full px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Check-in
          </label>
          <div className="flex items-center gap-2 text-navy-900">
            <CalendarIcon className="w-5 h-5 text-gold-500 flex-shrink-0" />
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
              placeholderText="Add date"
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium placeholder:font-normal placeholder:text-gray-400"
              dateFormat="MMM d, yyyy"
              required
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="flex-1 w-full px-4 py-2 border-b md:border-b-0 md:border-r border-gray-100">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Check-out
          </label>
          <div className="flex items-center gap-2 text-navy-900">
            <CalendarIcon className="w-5 h-5 text-gold-500 flex-shrink-0" />
            <DatePicker
              selected={checkOut}
              onChange={(date) => setCheckOut(date)}
              selectsEnd
              startDate={checkIn}
              endDate={checkOut}
              minDate={checkIn ? new Date(checkIn.getTime() + 86400000) : new Date()}
              placeholderText="Add date"
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium placeholder:font-normal placeholder:text-gray-400"
              dateFormat="MMM d, yyyy"
              required
            />
          </div>
        </div>

        {/* Guests */}
        <div className="flex-1 w-full px-4 py-2">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
            Guests
          </label>
          <div className="flex items-center gap-2 text-navy-900">
            <Users className="w-5 h-5 text-gold-500 flex-shrink-0" />
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
              className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-medium cursor-pointer"
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'Guest' : 'Guests'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Button */}
        <div className="w-full md:w-auto px-2 pb-2 md:pb-0">
          <button
            type="submit"
            className="w-full md:w-auto h-12 md:h-14 px-8 bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 shadow-md shadow-gold-500/20"
          >
            <Search className="w-5 h-5" />
            <span>Search</span>
          </button>
        </div>
      </form>
    </div>
  );
}
