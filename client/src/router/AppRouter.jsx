import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import ChatWidget from '../components/chat/ChatWidget';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';

// Public Core Pages (eager loaded for immediate interaction)
import HomePage from '../pages/public/HomePage';
import RoomsPage from '../pages/public/RoomsPage';

// Lazy Loaded Pages
const RoomDetailPage = lazy(() => import('../pages/public/RoomDetailPage'));
const RestaurantPage = lazy(() => import('../pages/public/RestaurantPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));

// Auth
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));

// Booking
const BookingPage = lazy(() => import('../pages/booking/BookingPage'));
const ConfirmationPage = lazy(() => import('../pages/booking/ConfirmationPage'));

// Guest
const MyReservationsPage = lazy(() => import('../pages/guest/MyReservationsPage'));
const ProfilePage = lazy(() => import('../pages/guest/ProfilePage'));

// Dashboard
const DashboardHome = lazy(() => import('../pages/dashboard/DashboardHome'));
const ReservationsPage = lazy(() => import('../pages/dashboard/ReservationsPage'));
const RoomsManagePage = lazy(() => import('../pages/dashboard/RoomsManagePage'));
const RestaurantManagePage = lazy(() => import('../pages/dashboard/RestaurantManagePage'));
const ReportsPage = lazy(() => import('../pages/dashboard/ReportsPage'));
const UsersPage = lazy(() => import('../pages/dashboard/UsersPage'));
const KnowledgePage = lazy(() => import('../pages/dashboard/KnowledgePage'));

const PageFallback = () => (
  <div className="min-h-[50vh] flex items-center justify-center">
    <div className="w-8 h-8 border-3 border-gold-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

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
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ChatWidget />
      <Suspense fallback={<PageFallback />}>
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
          <Route path="knowledge" element={
            <RoleRoute allowedRoles={['admin', 'manager']}>
              <KnowledgePage />
            </RoleRoute>
          } />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </Router>
  );
}
