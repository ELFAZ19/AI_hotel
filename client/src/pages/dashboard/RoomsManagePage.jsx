import { useState, useEffect, useCallback } from 'react';
import { getAllRooms, getRoomTypes, createRoom, updateRoom, setRoomStatus } from '../../services/roomService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { Plus, Edit2, X, BedDouble, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  available:   'text-emerald-700 bg-emerald-50 border-emerald-200',
  occupied:    'text-blue-700   bg-blue-50   border-blue-200',
  maintenance: 'text-amber-700  bg-amber-50  border-amber-200',
  inactive:    'text-gray-600   bg-gray-50   border-gray-200',
};

const INITIAL_FORM = {
  room_number: '',
  room_type_id: '',
  floor: '',
  status: 'available',
  price_override: '',
  description: '',
};

function RoomModal({ open, onClose, onSaved, editRoom, roomTypes }) {
  const [form, setForm] = useState(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(
        editRoom
          ? {
              room_number:    editRoom.room_number ?? '',
              room_type_id:   editRoom.room_type_id ?? '',
              floor:          editRoom.floor ?? '',
              status:         editRoom.status ?? 'available',
              price_override: editRoom.price_override ?? '',
              description:    editRoom.description ?? '',
            }
          : INITIAL_FORM
      );
    }
  }, [open, editRoom]);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_number.trim()) return toast.error('Room number is required');
    if (!form.room_type_id) return toast.error('Room type is required');
    if (!form.floor) return toast.error('Floor is required');

    setSaving(true);
    try {
      const payload = {
        room_number:    form.room_number.trim(),
        room_type_id:   Number(form.room_type_id),
        floor:          Number(form.floor),
        status:         form.status,
        price_override: form.price_override ? Number(form.price_override) : null,
        description:    form.description.trim() || null,
      };

      if (editRoom) {
        await updateRoom(editRoom.id, payload);
        toast.success('Room updated');
      } else {
        await createRoom(payload);
        toast.success('Room created');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save room');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-navy-900">
            {editRoom ? 'Edit Room' : 'Add New Room'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Room Number *</label>
              <input
                type="text"
                value={form.room_number}
                onChange={e => setForm(f => ({ ...f, room_number: e.target.value }))}
                placeholder="e.g. 101"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Floor *</label>
              <input
                type="number"
                value={form.floor}
                onChange={e => setForm(f => ({ ...f, floor: e.target.value }))}
                placeholder="e.g. 1"
                min="1"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Room Type *</label>
            <select
              value={form.room_type_id}
              onChange={e => setForm(f => ({ ...f, room_type_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500 outline-none"
            >
              <option value="">Select a room type...</option>
              {roomTypes.map(rt => (
                <option key={rt.id} value={rt.id}>
                  {rt.name} — ETB {Number(rt.base_price).toLocaleString()}/night
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
              <select
                value={form.status}
                onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500 outline-none"
              >
                <option value="available">Available</option>
                <option value="occupied">Occupied</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Price Override (ETB)</label>
              <input
                type="number"
                value={form.price_override}
                onChange={e => setForm(f => ({ ...f, price_override: e.target.value }))}
                placeholder="Leave blank for base price"
                min="0"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={2}
              placeholder="Optional room notes..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-navy-500 focus:ring-1 focus:ring-navy-500 outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-navy-900 bg-gold-500 hover:bg-gold-600 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : editRoom ? 'Save Changes' : 'Create Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RoomsManagePage() {
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editRoom, setEditRoom] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null); // { id, newStatus }
  const [statusLoading, setStatusLoading] = useState(false);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const [roomsRes, typesRes] = await Promise.all([getAllRooms(), getRoomTypes()]);
      if (roomsRes.success) setRooms(roomsRes.data);
      if (typesRes.success) setRoomTypes(typesRes.data);
    } catch {
      toast.error('Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRooms(); }, [fetchRooms]);

  const filteredRooms = rooms.filter(r =>
    !search || r.room_number?.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditRoom(null); setModalOpen(true); };
  const openEdit = (room) => {
    setEditRoom({ ...room, room_type_id: room.room_type_id });
    setModalOpen(true);
  };

  const requestStatusChange = (id, newStatus) => {
    if (newStatus === 'inactive') {
      setConfirmTarget({ id, newStatus });
      setConfirmOpen(true);
    } else {
      applyStatusChange(id, newStatus);
    }
  };

  const applyStatusChange = async (id, newStatus) => {
    setStatusLoading(true);
    try {
      const res = await setRoomStatus(id, newStatus);
      if (res.success) {
        toast.success('Room status updated');
        setRooms(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
      }
    } catch {
      toast.error('Failed to update room status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleConfirmStatus = async () => {
    if (!confirmTarget) return;
    await applyStatusChange(confirmTarget.id, confirmTarget.newStatus);
    setConfirmOpen(false);
    setConfirmTarget(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Manage Rooms</h1>
          <p className="text-sm text-gray-500 mt-0.5">{rooms.length} total rooms</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-navy-900 text-sm font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Room
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {['available', 'occupied', 'maintenance', 'inactive'].map(s => {
          const count = rooms.filter(r => r.status === s).length;
          return (
            <div key={s} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${STATUS_COLORS[s]}`}>
              <span className="capitalize">{s}</span>
              <span className="font-bold">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Table card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search room number..."
              value={search}
              onChange={e => setSearch(e.target.value)}
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
                <th className="px-6 py-4">Price / Night</th>
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
              ) : filteredRooms.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <BedDouble className="w-10 h-10" />
                      <p className="text-sm">No rooms found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRooms.map((room) => {
                  const price = room.price_override ?? room.base_price ?? 0;
                  return (
                    <tr key={room.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-navy-900">{room.room_number}</td>
                      <td className="px-6 py-4 text-gray-600">{room.room_type_name}</td>
                      <td className="px-6 py-4 text-gray-600">Floor {room.floor}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        ETB {Number(price).toLocaleString()}
                        {room.price_override && (
                          <span className="ml-1 text-xs text-amber-600 font-normal">(override)</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={room.status}
                          disabled={statusLoading}
                          onChange={e => requestStatusChange(room.id, e.target.value)}
                          className={`text-xs font-medium px-2 py-1 rounded-md border outline-none cursor-pointer ${STATUS_COLORS[room.status]}`}
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openEdit(room)}
                          className="p-1.5 text-gray-400 hover:text-navy-600 hover:bg-navy-50 rounded-md transition-colors"
                          title="Edit Room"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <RoomModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={fetchRooms}
        editRoom={editRoom}
        roomTypes={roomTypes}
      />

      {/* Confirm set-inactive dialog */}
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Set Room Inactive?"
        description="This will hide the room from bookings. You can re-activate it anytime by changing the status back to Available."
        confirmLabel="Set Inactive"
        variant="warning"
        loading={statusLoading}
        onConfirm={handleConfirmStatus}
      />
    </div>
  );
}
