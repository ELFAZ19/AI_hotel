import { useAuthStore } from '../../store/authStore';
import { User, Mail, Phone, ShieldCheck } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gray-50 pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="mb-10 animate-fade-in">
          <h1 className="font-serif text-3xl font-bold text-navy-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and preferences.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
          <div className="p-8 border-b border-gray-100 flex items-center gap-6">
            <div className="w-24 h-24 bg-gold-100 rounded-full flex items-center justify-center text-gold-600 flex-shrink-0">
              <User className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-navy-900">{user?.firstName} {user?.lastName}</h2>
              <p className="text-gray-500 capitalize">{user?.role} Account</p>
            </div>
          </div>

          <div className="p-8 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-navy-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gold-500" /> Account Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Mail className="w-4 h-4" /> <span className="text-xs font-semibold uppercase tracking-wider">Email</span>
                  </div>
                  <p className="font-medium text-navy-900">{user?.email}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="flex items-center gap-2 text-gray-500 mb-1">
                    <Phone className="w-4 h-4" /> <span className="text-xs font-semibold uppercase tracking-wider">Phone</span>
                  </div>
                  <p className="font-medium text-navy-900">{user?.phone || 'Not provided'}</p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
              <div className="mt-0.5 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <p className="text-sm text-blue-800">
                To update your account information, please contact our support team. Profile editing will be available in a future update.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
