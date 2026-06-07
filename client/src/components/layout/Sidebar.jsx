import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  UtensilsCrossed,
  BarChart3,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const user = useAuthStore(state => state.user);
  const isManagerOrAdmin = user?.role === 'admin' || user?.role === 'manager';

  const navItems = [
    { label: 'Overview',      to: '/dashboard',              icon: LayoutDashboard,  visible: true },
    { label: 'Reservations',  to: '/dashboard/reservations', icon: CalendarCheck,    visible: true },
    { label: 'Rooms',         to: '/dashboard/rooms',        icon: BedDouble,        visible: isManagerOrAdmin },
    { label: 'Restaurant',    to: '/dashboard/restaurant',   icon: UtensilsCrossed,  visible: true },
    { label: 'Reports',       to: '/dashboard/reports',      icon: BarChart3,        visible: isManagerOrAdmin },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-navy-950 text-white transition-all duration-300 z-40 flex flex-col ${
        collapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-navy-800">
        <Link to="/" className="font-serif text-lg font-bold truncate">
          {collapsed ? (
            <span className="text-gold-500">A</span>
          ) : (
            <>Adane<span className="text-gold-500">.</span></>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.filter(item => item.visible).map(({ label, to, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-gold-500/15 text-gold-400'
                  : 'text-gray-400 hover:text-white hover:bg-navy-800'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-3 border-t border-navy-800">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-navy-800 transition-colors text-sm"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
