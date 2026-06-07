import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../lib/axios';
import { User, Mail, Phone, Lock, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        password: formData.password,
      });

      if (response.data.success) {
        navigate('/login', { state: { message: 'Registration successful! Please log in.' } });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white animate-fade-in">
      
      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16 order-2 lg:order-1">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden block text-3xl font-serif font-bold text-navy-900 mb-12 text-center">
            Adane<span className="text-gold-500">.</span>
          </Link>

          <div className="text-center lg:text-left mb-10">
            <h1 className="text-3xl font-bold text-navy-900 mb-2">Create Account</h1>
            <p className="text-gray-500">Join us to manage your bookings and enjoy exclusive perks.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-navy-900 mb-2">First Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy-900 mb-2">Last Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                    required
                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all disabled:opacity-50"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">Phone <span className="text-gray-400 font-normal">(Optional)</span></label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="+251 911 223344"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {loading ? "Creating account..." : (
                <>Create Account <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-navy-900 hover:text-gold-600 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>

      {/* Right Panel: Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy-950 order-1 lg:order-2">
        <img
          src="https://images.unsplash.com/photo-1582719508461-905c673771fd?q=80&w=2000&auto=format&fit=crop"
          alt="Hotel Room Detail"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-16 w-full">
          <Link to="/" className="absolute top-12 right-16 text-3xl font-serif font-bold text-white">
            Adane<span className="text-gold-500">.</span>
          </Link>
          <div className="max-w-md animate-fade-in-up">
            <h2 className="text-4xl font-serif font-bold text-white mb-4">Start Your Journey</h2>
            <p className="text-gray-300 text-lg font-light leading-relaxed">
              Create an account today to streamline your booking experience and unlock exclusive member benefits.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
