import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Menu, X, User, LogOut, ChevronDown } from 'lucide-react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Rooms', to: '/rooms' },
    { label: 'Restaurant', to: '/restaurant' },
    { label: 'Contact', to: '/contact' },
  ];

  const bgClass = scrolled || !isHome
    ? 'bg-white/95 backdrop-blur-md shadow-sm'
    : 'bg-transparent';
  const textClass = scrolled || !isHome ? 'text-navy-900' : 'text-white';
  const logoClass = scrolled || !isHome ? 'text-navy-900' : 'text-white';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${bgClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link to="/" className={`font-serif text-xl lg:text-2xl font-bold transition-colors ${logoClass}`}>
            Adane<span className="text-gold-500">.</span> Hotel
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`text-sm font-medium transition-colors relative group ${
                  location.pathname === link.to
                    ? 'text-gold-500'
                    : `${textClass} hover:text-gold-500`
                }`}
              >
                {link.label}
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-gold-500 transition-all ${
                  location.pathname === link.to ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            ))}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex items-center gap-3">
            {token ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${textClass} hover:text-gold-500`}
                >
                  <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-gold-600" />
                  </div>
                  <span>{user?.firstName || 'Account'}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-12 bg-white rounded-xl shadow-xl border border-gray-100 py-2 w-48 z-50 animate-fade-in">
                      {user?.role === 'guest' ? (
                        <>
                          <Link to="/my-reservations" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            My Reservations
                          </Link>
                          <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            Profile
                          </Link>
                        </>
                      ) : (
                        <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          Dashboard
                        </Link>
                      )}
                      <hr className="my-1 border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`text-sm font-medium transition-colors ${textClass} hover:text-gold-500`}
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-medium px-5 py-2.5 bg-gold-500 hover:bg-gold-600 text-navy-900 rounded-lg transition-colors shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`md:hidden p-2 transition-colors ${textClass}`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-lg animate-slide-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'bg-gold-50 text-gold-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="my-2 border-gray-100" />
            {token ? (
              <>
                {user?.role === 'guest' ? (
                  <Link to="/my-reservations" className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    My Reservations
                  </Link>
                ) : (
                  <Link to="/dashboard" className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                    Dashboard
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Sign In</Link>
                <Link to="/register" className="block px-4 py-3 rounded-lg text-sm font-medium text-center bg-gold-500 text-navy-900 hover:bg-gold-600">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
