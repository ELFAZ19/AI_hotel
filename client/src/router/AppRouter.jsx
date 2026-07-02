import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Auth
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';

// Public Pages
import HomePage from '../pages/public/HomePage';
import RoomsPage from '../pages/public/RoomsPage';
import RoomDetailPage from '../pages/public/RoomDetailPage';
import RestaurantPage from '../pages/public/RestaurantPage';
import ContactPage from '../pages/public/ContactPage';

// Booking
import BookingPage from '../pages/booking/BookingPage';
import ConfirmationPage from '../pages/booking/ConfirmationPage';

// Guest
import MyReservationsPage from '../pages/guest/MyReservationsPage';
import ProfilePage from '../pages/guest/ProfilePage';

// Dashboard
import DashboardHome from '../pages/dashboard/DashboardHome';
import ReservationsPage from '../pages/dashboard/ReservationsPage';
import RoomsManagePage from '../pages/dashboard/RoomsManagePage';
import RestaurantManagePage from '../pages/dashboard/RestaurantManagePage';
import ReportsPage from '../pages/dashboard/ReportsPage';
import UsersPage from '../pages/dashboard/UsersPage';

// Role-based protection wrapper for dashboard
const RoleRoute = ({ children, allowedRoles }) => {
  const user = useAuthStore(state => state.user);
  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
};

// Redirect receptionists to reservations instead of overview
const DashboardIndexRoute = () => {
  const user = useAuthStore(state => state.user);
  if (user?.role === 'receptionist') {
    return <Navigate to="/dashboard/reservations" replace />;
  }
  return <DashboardHome />;
};

export default function AppRouter() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Public Layout Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/rooms/:id" element={<RoomDetailPage />} />
          <Route path="/restaurant" element={<RestaurantPage />} />
          <Route path="/contact" element={<ContactPage />} />

          {/* Guest Protected Routes */}
          <Route path="/booking" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
          <Route path="/booking/confirmation" element={<ProtectedRoute><ConfirmationPage /></ProtectedRoute>} />
          <Route path="/my-reservations" element={<ProtectedRoute><MyReservationsPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        </Route>

        {/* Dashboard Layout Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RoleRoute allowedRoles={['admin', 'manager', 'receptionist']}>
              <DashboardLayout />
            </RoleRoute>
          </ProtectedRoute>
        }>
          <Route index element={<DashboardIndexRoute />} />
          <Route path="reservations" element={<ReservationsPage />} />
          <Route path="rooms" element={
            <RoleRoute allowedRoles={['admin', 'manager']}>
              <RoomsManagePage />
            </RoleRoute>
          } />
          <Route path="restaurant" element={<RestaurantManagePage />} />
          <Route path="reports" element={
            <RoleRoute allowedRoles={['admin', 'manager']}>
              <ReportsPage />
            </RoleRoute>
          } />
          <Route path="users" element={
            <RoleRoute allowedRoles={['admin', 'manager']}>
              <UsersPage />
            </RoleRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
