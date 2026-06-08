import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { createRestaurantReservation } from '../../services/restaurantService';
import toast from 'react-hot-toast';
import { Utensils, Calendar, Clock, Users, ArrowRight } from 'lucide-react';

export default function RestaurantPage() {
  const { user } = useAuthStore();
  const isAuthenticated = !!user;
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    date: '',
    time: '19:00',
    partySize: 2,
    specialRequests: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to make a reservation');
      navigate('/login?redirect=/restaurant');
      return;
    }

    setLoading(true);
    try {
      const res = await createRestaurantReservation(formData);
      if (res.success) {
        toast.success('Table reserved successfully!');
        setFormData({ date: '', time: '19:00', partySize: 2, specialRequests: '' });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.errors?.[0] 
        || error.response?.data?.message 
        || 'Failed to reserve table';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const timeOptions = [
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', 
    '20:00', '20:30', '21:00', '21:30', '22:00'
  ];

  return (
    <div className="min-h-screen bg-white pt-20">
      {/* Hero */}
      <section className="relative h-[60vh] min-h-[400px] flex items-center justify-center">
        <div className="absolute inset-0 bg-navy-950">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
        </div>
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto animate-fade-in-up">
          <p className="text-gold-400 font-semibold tracking-widest uppercase text-sm mb-4">Culinary Excellence</p>
          <h1 className="font-serif text-5xl md:text-6xl text-white font-bold mb-6">Fine Dining Experience</h1>
          <p className="text-gray-300 text-lg">Savor the authentic flavors of Ethiopia alongside international cuisine, prepared by our master chefs.</p>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Info */}
          <div>
            <div className="w-16 h-16 bg-gold-50 rounded-full flex items-center justify-center mb-6">
              <Utensils className="w-8 h-8 text-gold-500" />
            </div>
            <h2 className="font-serif text-4xl font-bold text-navy-900 mb-6">Book a Table</h2>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Experience a memorable evening at our signature restaurant. Our carefully crafted menu features both local specialties and international favorites, using the freshest seasonal ingredients.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-navy-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-navy-900">Opening Hours</h4>
                  <p className="text-gray-600">Dinner: 5:00 PM - 10:30 PM (Daily)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-navy-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Utensils className="w-5 h-5 text-navy-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-navy-900">Dress Code</h4>
                  <p className="text-gray-600">Smart Casual. No beachwear or flip-flops permitted during dinner service.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative">
            <h3 className="text-2xl font-bold text-navy-900 mb-6">Reservation Details</h3>
            
            {!isAuthenticated && (
              <div className="mb-6 p-4 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-sm">
                You must be logged in to reserve a table online.
                <button 
                  onClick={() => navigate('/login?redirect=/restaurant')}
                  className="font-semibold underline ml-2 hover:text-amber-900"
                >
                  Log in here
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all outline-none"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Clock className="h-5 w-5 text-gray-400" />
                    </div>
                    <select
                      required
                      className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all outline-none appearance-none"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    >
                      {timeOptions.map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Party Size</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    required
                    className="pl-10 w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all outline-none"
                    value={formData.partySize}
                    onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Special Requests (Optional)</label>
                <textarea
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gold-500 focus:border-transparent transition-all outline-none resize-none"
                  placeholder="Dietary requirements, special occasions, seating preferences..."
                  value={formData.specialRequests}
                  onChange={(e) => setFormData({ ...formData, specialRequests: e.target.value })}
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 px-6 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Confirm Reservation'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </div>

        </div>
      </section>
    </div>
  );
}
