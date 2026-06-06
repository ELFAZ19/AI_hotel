import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Button } from '../components/ui/Button';
import axiosInstance from '../lib/axios';

export default function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuthStore();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get('/auth/me');
        if (response.data.success) {
          setUser(response.data.data);
        }
      } catch (err) {
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">Adane International Hotel</h1>
          <Button onClick={handleLogout} className="bg-red-600 hover:bg-red-700">
            Logout
          </Button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            Welcome back, {user?.firstName}!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Email</p>
              <p className="text-lg font-semibold text-gray-800">{user?.email}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="text-lg font-semibold text-gray-800">
                {user?.firstName} {user?.lastName}
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-md">
              <p className="text-sm text-gray-600">Role</p>
              <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                {user?.role}
              </span>
            </div>

            {user?.phone && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm text-gray-600">Phone</p>
                <p className="text-lg font-semibold text-gray-800">{user?.phone}</p>
              </div>
            )}
          </div>

          <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-green-800 font-semibold">✓ Full stack is working!</p>
            <p className="text-green-700 text-sm mt-1">React → Node.js → PostgreSQL connection verified.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
