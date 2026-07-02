import { useEffect, useState } from 'react';
import { getDashboardStats, getRevenueReport } from '../../services/adminService';
import StatCard from '../../components/dashboard/StatCard';
import RevenueChart from '../../components/dashboard/RevenueChart';
import ReservationBadge from '../../components/dashboard/ReservationBadge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { format, subMonths } from 'date-fns';
import { BedDouble, CalendarRange, Wallet, Percent, BotMessageSquare } from 'lucide-react';
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
        if (chartRes.success && chartRes.data.length > 0) {
          // Format data for chart — backend returns { date, revenue, reservations_count }
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard 
          title="Total Reservations" 
          value={stats?.overview?.totalReservations ?? 0} 
          icon={CalendarRange} 
        />
        <StatCard 
          title="Revenue (Month)" 
          value={`ETB ${(stats?.revenue?.thisMonth ?? 0).toLocaleString()}`} 
          icon={Wallet} 
        />
        <StatCard 
          title="Available Rooms" 
          value={stats?.overview?.availableRooms ?? 0} 
          icon={BedDouble} 
        />
        <StatCard 
          title="Occupancy Rate" 
          value={`${stats?.occupancyRate ?? 0}%`} 
          icon={Percent} 
        />
        <StatCard 
          title="AI Chats Today" 
          value={stats?.aiStats?.todaySessions ?? 0} 
          icon={BotMessageSquare}
          subtitle={`${stats?.aiStats?.totalSessions ?? 0} total sessions`}
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
                    {res.guestName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Room {res.roomNumber}
                  </p>
                </div>
                <div className="text-right">
                  <ReservationBadge status={res.status} />
                  <p className="text-xs font-medium text-gray-600 mt-1">
                    ETB {Number(res.totalPrice).toLocaleString()}
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
