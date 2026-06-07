import { useEffect, useState } from 'react';
import { getDashboardStats, getRevenueReport } from '../../services/adminService';
import StatCard from '../../components/dashboard/StatCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import ReservationBadge from '../../components/dashboard/ReservationBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { format, subMonths } from 'date-fns';
import { BedDouble, CalendarRange, Wallet, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

export default function DashboardHome() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, chartRes] = await Promise.all([
          getDashboardStats(),
          // Get last 6 months revenue for chart
          getRevenueReport(
            format(subMonths(new Date(), 5), 'yyyy-MM-01'), // 6 months ago, 1st day
            format(new Date(), 'yyyy-MM-dd')
          )
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (chartRes.success) {
          // Format data for chart
          const formatted = chartRes.data.map(item => ({
            date: item.date ? format(new Date(item.date), 'MMM dd') : 'Unknown',
            revenue: Number(item.revenue),
          }));
          setChartData(formatted);
        }
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-navy-900 mb-6">Dashboard Overview</h1>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Reservations" 
          value={stats?.totalReservations || 0} 
          icon={CalendarRange} 
          trend={12} // Mock trend for UI
        />
        <StatCard 
          title="Revenue (Month)" 
          value={`ETB ${(stats?.monthlyRevenue || 0).toLocaleString()}`} 
          icon={Wallet} 
          trend={8}
        />
        <StatCard 
          title="Available Rooms" 
          value={stats?.availableRooms || 0} 
          icon={BedDouble} 
        />
        <StatCard 
          title="Occupancy Rate" 
          value={`${stats?.occupancyRate || 0}%`} 
          icon={Percent} 
          trend={-2}
        />
      </div>

      {/* Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} />
        </div>
        
        {/* Recent Reservations Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col">
          <h3 className="text-lg font-bold text-navy-900 mb-6">Recent Bookings</h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {stats?.recentReservations?.map(res => (
              <div key={res.id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm font-semibold text-navy-900">
                    {res.guest?.firstName} {res.guest?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Room {res.room?.room_number} • {res.check_in ? format(new Date(res.check_in), 'MMM d') : 'TBD'}
                  </p>
                </div>
                <div className="text-right">
                  <ReservationBadge status={res.status} />
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    ETB {Number(res.total_price).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            {(!stats?.recentReservations || stats.recentReservations.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-4">No recent bookings</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
