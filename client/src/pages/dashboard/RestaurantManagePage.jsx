import { useState, useEffect } from 'react';
import { getAllDiningReservations, updateDiningReservationStatus } from '../../services/restaurantService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import { format } from 'date-fns';
import { UtensilsCrossed, Calendar, Users, Clock, Search, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RestaurantManagePage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await getAllDiningReservations({
        date: dateFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 10
      });
      if (res.success) {
        setReservations(res.data);
        setTotalPages(res.totalPages);
      }
    } catch (error) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [dateFilter, statusFilter, page]);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await updateDiningReservationStatus(id, newStatus);
      if (res.success) {
        toast.success(`Reservation status updated to ${newStatus}`);
        setReservations(reservations.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Restaurant Management</h1>
          <p className="text-gray-500 mt-1">Manage dining reservations and table statuses.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              className="pl-9 w-full rounded-lg border-gray-200 text-sm focus:ring-gold-500 focus:border-gold-500"
              value={dateFilter}
              onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        
        <div className="w-full sm:w-auto flex-1">
          <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
          <select
            className="w-full rounded-lg border-gray-200 text-sm focus:ring-gold-500 focus:border-gold-500"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="seated">Seated</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="no_show">No Show</option>
          </select>
        </div>
        
        <div className="w-full sm:w-auto">
          <button 
            onClick={() => { setDateFilter(''); setStatusFilter(''); setPage(1); }}
            className="w-full px-4 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Party Size</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requests</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <LoadingSpinner size="md" className="mx-auto" />
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12">
                    <EmptyState 
                      icon={UtensilsCrossed}
                      title="No reservations found"
                      description="Try adjusting your filters or search criteria."
                    />
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gold-100 flex items-center justify-center text-gold-600 font-bold text-xs mr-3">
                          {res.first_name?.[0]}{res.last_name?.[0]}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{res.first_name} {res.last_name}</div>
                          <div className="text-sm text-gray-500">{res.phone || res.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-gray-400" /> {format(new Date(res.reservation_date), 'MMM d, yyyy')}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1"><Clock className="w-3.5 h-3.5 text-gray-400" /> {res.reservation_time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-gray-400" /> {res.party_size} People</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500 max-w-[200px] truncate" title={res.special_requests}>
                        {res.special_requests || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 border-0 ${
                          res.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                          res.status === 'seated' ? 'bg-blue-100 text-blue-800' :
                          res.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          res.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}
                        value={res.status}
                        onChange={(e) => handleStatusChange(res.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="seated">Seated</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="no_show">No Show</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-gray-400 hover:text-navy-900 transition-colors">
                        <MoreVertical className="w-5 h-5 inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Showing page <span className="font-medium text-navy-900">{page}</span> of <span className="font-medium text-navy-900">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm font-medium bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
