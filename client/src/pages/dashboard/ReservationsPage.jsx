import { useState, useEffect } from 'react';
import { getAllReservations, updateReservationStatus } from '../../services/reservationService';
import ReservationBadge from '../../components/dashboard/ReservationBadge';
import Pagination from '../../components/shared/Pagination';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { Search, Filter, MoreVertical, Check, X } from 'lucide-react';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  
  // State for row actions
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const res = await getAllReservations({ page, limit: 10, status: statusFilter });
      if (res.success) {
        setReservations(res.data);
        setTotalPages(res.totalPages || 1);
      }
    } catch (error) {
      toast.error('Failed to load reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [page, statusFilter]);

  const handleStatusChange = async (id, newStatus) => {
    setActionLoadingId(id);
    try {
      const res = await updateReservationStatus(id, { status: newStatus });
      if (res.success) {
        toast.success(`Reservation marked as ${newStatus.replace('_', ' ')}`);
        fetchReservations(); // refresh list
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update status');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-navy-900">Reservations</h1>
        
        {/* Filters */}
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search guests..." 
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500 outline-none"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500 outline-none appearance-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Guest</th>
                <th className="px-6 py-4">Room</th>
                <th className="px-6 py-4">Dates</th>
                <th className="px-6 py-4">Total Price</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <LoadingSpinner size="md" className="mx-auto" />
                  </td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No reservations found matching the criteria.
                  </td>
                </tr>
              ) : (
                reservations.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-navy-900">{res.first_name} {res.last_name}</p>
                      <p className="text-xs text-gray-500">{res.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">Room {res.room_number}</p>
                      <p className="text-xs text-gray-500">{res.room_type_name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900">{res.check_in ? format(new Date(res.check_in), 'MMM dd, yyyy') : 'TBD'}</p>
                      <p className="text-xs text-gray-500">to {res.check_out ? format(new Date(res.check_out), 'MMM dd, yyyy') : 'TBD'}</p>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      ETB {Number(res.total_price).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <ReservationBadge status={res.status} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {res.status === 'confirmed' && (
                          <button 
                            onClick={() => handleStatusChange(res.id, 'checked_in')}
                            disabled={actionLoadingId === res.id}
                            className="px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Check In
                          </button>
                        )}
                        {res.status === 'checked_in' && (
                          <button 
                            onClick={() => handleStatusChange(res.id, 'checked_out')}
                            disabled={actionLoadingId === res.id}
                            className="px-3 py-1.5 text-xs font-medium text-navy-700 bg-navy-50 hover:bg-navy-100 rounded-md transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Check Out
                          </button>
                        )}
                        {['pending', 'confirmed'].includes(res.status) && (
                          <button 
                            onClick={() => handleStatusChange(res.id, 'cancelled')}
                            disabled={actionLoadingId === res.id}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1.5 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded-md transition-colors" title="View Details">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

    </div>
  );
}
