import { useState, useEffect } from 'react';
import { getAllRooms, setRoomStatus } from '../../services/roomService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Plus, Edit2, Image as ImageIcon, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RoomsManagePage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = async () => {
    try {
      const res = await getAllRooms();
      if (res.success) setRooms(res.data);
    } catch (error) {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      const res = await setRoomStatus(id, newStatus);
      if (res.success) {
        toast.success('Room status updated');
        setRooms(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy-900">Manage Rooms</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-navy-900 text-sm font-medium rounded-lg transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search room number..." 
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:bg-white focus:ring-1 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-4">Room No.</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Floor</th>
                <th className="px-6 py-4">Base Price</th>
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
              ) : (
                rooms.map((room) => {
                  const price = room.price_override || room.room_type?.base_price || 0;
                  const statusColors = {
                    available: 'text-emerald-700 bg-emerald-50 border-emerald-200',
                    occupied: 'text-blue-700 bg-blue-50 border-blue-200',
                    maintenance: 'text-amber-700 bg-amber-50 border-amber-200',
                    inactive: 'text-gray-700 bg-gray-50 border-gray-200',
                  };

                  return (
                    <tr key={room.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-navy-900">{room.room_number}</td>
                      <td className="px-6 py-4 text-gray-600">{room.room_type?.name}</td>
                      <td className="px-6 py-4 text-gray-600">{room.floor}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">ETB {price.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <select
                          value={room.status}
                          onChange={(e) => handleStatusChange(room.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border outline-none cursor-pointer ${statusColors[room.status]}`}
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button className="p-1.5 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded-md transition-colors" title="Manage Images">
                            <ImageIcon className="w-4 h-4" />
                          </button>
                          <button className="p-1.5 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded-md transition-colors" title="Edit Room">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
