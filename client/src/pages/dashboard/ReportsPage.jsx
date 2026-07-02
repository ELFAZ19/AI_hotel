import { useState, useEffect, useCallback } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from 'recharts';
import { getRevenueReport, getOccupancyReport } from '../../services/adminService';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { TrendingUp, BedDouble, Calendar, Download, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Preset date ranges ────────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Last 7 days',    getRange: () => ({ from: format(subDays(new Date(), 6), 'yyyy-MM-dd'),     to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 30 days',   getRange: () => ({ from: format(subDays(new Date(), 29), 'yyyy-MM-dd'),    to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'This month',     getRange: () => ({ from: format(startOfMonth(new Date()), 'yyyy-MM-dd'),   to: format(endOfMonth(new Date()), 'yyyy-MM-dd') }) },
  { label: 'Last 3 months',  getRange: () => ({ from: format(subMonths(new Date(), 3), 'yyyy-MM-dd'),   to: format(new Date(), 'yyyy-MM-dd') }) },
  { label: 'Last 6 months',  getRange: () => ({ from: format(subMonths(new Date(), 6), 'yyyy-MM-dd'),   to: format(new Date(), 'yyyy-MM-dd') }) },
];

// ─── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ icon: Icon, label, value, sub, color = 'navy' }) {
  const colorMap = {
    navy:    'bg-navy-50 text-navy-600',
    gold:    'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue:    'bg-blue-50 text-blue-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-start gap-4">
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 mb-0.5">{label}</p>
        <p className="text-xl font-bold text-navy-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const RevenueTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-amber-600 font-bold">ETB {Number(payload[0]?.value || 0).toLocaleString()}</p>
      {payload[1] && <p className="text-navy-600 mt-0.5">{payload[1].value} reservations</p>}
    </div>
  );
};

const OccupancyTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const occupied = payload.find(p => p.dataKey === 'occupied')?.value ?? 0;
  const total    = payload.find(p => p.dataKey === 'total')?.value ?? 0;
  const rate     = payload.find(p => p.dataKey === 'occupancy_rate')?.value ?? 0;
  return (
    <div className="bg-white border border-gray-100 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-emerald-600 font-bold">{rate}% occupancy</p>
      <p className="text-gray-500 mt-0.5">{occupied} / {total} rooms</p>
    </div>
  );
};

// ─── Export helper ─────────────────────────────────────────────────────────────
function exportCSV(rows, filename) {
  if (!rows.length) return toast.error('No data to export');
  const headers = Object.keys(rows[0]).join(',');
  const body = rows.map(r => Object.values(r).join(',')).join('\n');
  const blob = new Blob([`${headers}\n${body}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('revenue'); // 'revenue' | 'occupancy'

  // Date range
  const [from, setFrom] = useState(format(subMonths(new Date(), 1), 'yyyy-MM-dd'));
  const [to,   setTo]   = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activePreset, setActivePreset] = useState(null);

  // Data
  const [revenueData,   setRevenueData]   = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [loading, setLoading] = useState(false);

  const applyPreset = (preset) => {
    const range = preset.getRange();
    setFrom(range.from);
    setTo(range.to);
    setActivePreset(preset.label);
  };

  const fetchReports = useCallback(async () => {
    if (!from || !to) return;
    if (new Date(from) > new Date(to)) {
      toast.error('"From" date must be before "To" date');
      return;
    }
    setLoading(true);
    try {
      const [revRes, occRes] = await Promise.all([
        getRevenueReport(from, to),
        getOccupancyReport(from, to),
      ]);
      if (revRes.success) {
        setRevenueData(revRes.data.map(d => ({
          ...d,
          date: format(new Date(d.date), 'MMM d'),
          revenue: Number(d.revenue),
          reservations_count: Number(d.reservations_count),
        })));
      }
      if (occRes.success) {
        setOccupancyData(occRes.data.map(d => ({
          ...d,
          date: format(new Date(d.date), 'MMM d'),
          occupied: Number(d.occupied),
          total: Number(d.total),
          occupancy_rate: Number(d.occupancy_rate),
        })));
      }
    } catch {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  // ── Summary metrics ──
  const totalRevenue = revenueData.reduce((s, d) => s + d.revenue, 0);
  const totalBookings = revenueData.reduce((s, d) => s + d.reservations_count, 0);
  const avgRevPerDay  = revenueData.length ? totalRevenue / revenueData.length : 0;
  const avgOccupancy  = occupancyData.length
    ? occupancyData.reduce((s, d) => s + d.occupancy_rate, 0) / occupancyData.length
    : 0;
  const peakOccupancy = occupancyData.length
    ? Math.max(...occupancyData.map(d => d.occupancy_rate))
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Reports</h1>
          <p className="text-sm text-gray-500 mt-0.5">Revenue and occupancy analytics</p>
        </div>
        <button
          onClick={fetchReports}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Date range controls */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex flex-wrap gap-2 flex-1">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => applyPreset(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors border ${
                activePreset === p.label
                  ? 'bg-navy-900 text-white border-navy-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-navy-300 hover:text-navy-700'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
            <input
              type="date"
              value={from}
              max={to}
              onChange={e => { setFrom(e.target.value); setActivePreset(null); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-navy-500"
            />
          </div>
          <span className="text-gray-400 mt-4">–</span>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
            <input
              type="date"
              value={to}
              min={from}
              onChange={e => { setTo(e.target.value); setActivePreset(null); }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-navy-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={TrendingUp}
          label="Total Revenue"
          value={`ETB ${totalRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
          sub={`${revenueData.length} days`}
          color="gold"
        />
        <SummaryCard
          icon={Calendar}
          label="Total Bookings"
          value={totalBookings}
          sub={`Avg ETB ${Math.round(avgRevPerDay).toLocaleString()} / day`}
          color="navy"
        />
        <SummaryCard
          icon={BedDouble}
          label="Avg Occupancy"
          value={`${avgOccupancy.toFixed(1)}%`}
          sub={`Peak: ${peakOccupancy}%`}
          color="emerald"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Avg Revenue / Booking"
          value={totalBookings ? `ETB ${Math.round(totalRevenue / totalBookings).toLocaleString()}` : '—'}
          color="blue"
        />
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {['revenue', 'occupancy'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
              activeTab === tab ? 'bg-white text-navy-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Charts */}
      {loading ? (
        <div className="h-80 flex items-center justify-center bg-white rounded-xl border border-gray-100 shadow-sm">
          <LoadingSpinner size="lg" />
        </div>
      ) : activeTab === 'revenue' ? (
        <div className="space-y-6">
          {/* Revenue Area Chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-navy-900">Daily Revenue</h3>
              <button
                onClick={() => exportCSV(
                  revenueData.map(d => ({ date: d.date, revenue: d.revenue, bookings: d.reservations_count })),
                  `revenue-${from}-${to}.csv`
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            {revenueData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                No revenue data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#dd9a26" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#dd9a26" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<RevenueTooltip />} />
                  <Area type="monotone" dataKey="revenue" stroke="#dd9a26" strokeWidth={2.5} fill="url(#revenueGrad)" dot={false} activeDot={{ r: 5, fill: '#dd9a26' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bookings Bar Chart */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-navy-900 mb-6">Daily Bookings</h3>
            {revenueData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={revenueData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, 'Bookings']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} />
                  <Bar dataKey="reservations_count" name="Bookings" fill="#1a2744" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Revenue Table */}
          {revenueData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-navy-900">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-medium sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Revenue (ETB)</th>
                      <th className="px-6 py-3">Bookings</th>
                      <th className="px-6 py-3">Avg / Booking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...revenueData].reverse().map(row => (
                      <tr key={row.date} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-navy-900">{row.date}</td>
                        <td className="px-6 py-3 text-amber-700 font-semibold">{row.revenue.toLocaleString()}</td>
                        <td className="px-6 py-3">{row.reservations_count}</td>
                        <td className="px-6 py-3 text-gray-600">
                          {row.reservations_count > 0
                            ? Math.round(row.revenue / row.reservations_count).toLocaleString()
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* OCCUPANCY TAB */
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold text-navy-900">Daily Occupancy Rate</h3>
              <button
                onClick={() => exportCSV(
                  occupancyData.map(d => ({ date: d.date, occupied: d.occupied, total: d.total, occupancy_rate: d.occupancy_rate })),
                  `occupancy-${from}-${to}.csv`
                )}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
            </div>
            {occupancyData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                No occupancy data for this period
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={occupancyData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <defs>
                    <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                  <Tooltip content={<OccupancyTooltip />} />
                  <Area type="monotone" dataKey="occupancy_rate" stroke="#10b981" strokeWidth={2.5} fill="url(#occGrad)" dot={false} activeDot={{ r: 5, fill: '#10b981' }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Rooms occupied bar */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-base font-bold text-navy-900 mb-6">Rooms Occupied vs Total</h3>
            {occupancyData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={occupancyData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} dy={8} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="total"    name="Total Rooms"    fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="occupied" name="Occupied Rooms" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Occupancy Table */}
          {occupancyData.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-base font-bold text-navy-900">Daily Breakdown</h3>
              </div>
              <div className="overflow-x-auto max-h-72 overflow-y-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-500 text-xs font-medium sticky top-0">
                    <tr>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Occupied</th>
                      <th className="px-6 py-3">Total</th>
                      <th className="px-6 py-3">Occupancy Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {[...occupancyData].reverse().map(row => (
                      <tr key={row.date} className="hover:bg-gray-50/50">
                        <td className="px-6 py-3 font-medium text-navy-900">{row.date}</td>
                        <td className="px-6 py-3">{row.occupied}</td>
                        <td className="px-6 py-3 text-gray-500">{row.total}</td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 max-w-[80px] h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${row.occupancy_rate >= 80 ? 'bg-amber-500' : row.occupancy_rate >= 50 ? 'bg-emerald-500' : 'bg-red-400'}`}
                                style={{ width: `${row.occupancy_rate}%` }}
                              />
                            </div>
                            <span className="font-semibold text-navy-900 text-xs">{row.occupancy_rate}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
