import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import axiosInstance from "../lib/axios";
import { ArrowRight, Mail, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  // If redirected here from booking or another protected route, we'll want to send them back there
  const from = location.state?.from?.pathname || "/dashboard";

  // Show a message if redirected from register
  useEffect(() => {
    if (location.state?.message) {
      toast.success(location.state.message);
    }
  }, [location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axiosInstance.post("/auth/login", {
        email,
        password,
      });

      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        setAuth(user, accessToken);
        toast.success("Welcome back!");
        
        // If they were trying to book, send them back to booking
        if (location.state?.from?.pathname === '/booking') {
          navigate('/booking', { replace: true });
        } else {
          // Otherwise, send admin to dashboard, guests to their profile/home
          navigate(user.role === 'guest' ? '/' : '/dashboard', { replace: true });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white animate-fade-in">
      {/* Left Panel: Image */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-navy-950">
        <img
          src="https://images.unsplash.com/photo-1542314831-c6a4d4598b0e?q=80&w=2000&auto=format&fit=crop"
          alt="Hotel Interior"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/20 to-transparent" />
        <div className="relative z-10 flex flex-col justify-end p-16 w-full">
          <Link to="/" className="absolute top-12 left-16 text-3xl font-serif font-bold text-white">
            Adane<span className="text-gold-500">.</span>
          </Link>
          <div className="max-w-md animate-fade-in-up">
            <h2 className="text-4xl font-serif font-bold text-white mb-4">Welcome Back</h2>
            <p className="text-gray-300 text-lg font-light leading-relaxed">
              Log in to manage your reservations, explore exclusive member rates, and experience unparalleled luxury.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden block text-3xl font-serif font-bold text-navy-900 mb-12 text-center">
            Adane<span className="text-gold-500">.</span>
          </Link>

          <div className="text-center lg:text-left mb-10">
            <h1 className="text-3xl font-bold text-navy-900 mb-2">Sign In</h1>
            <p className="text-gray-500">Please enter your details to access your account.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-navy-900 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-navy-900">Password</label>
                <a href="#" className="text-xs font-medium text-gold-600 hover:text-gold-700 transition-colors">
                  Forgot Password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 outline-none transition-all disabled:opacity-50"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-gold-500 hover:bg-gold-600 text-navy-900 font-bold rounded-xl transition-colors shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Signing in..." : (
                <>Sign In <ArrowRight className="w-5 h-5" /></>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-8">
            Don't have an account yet?{" "}
            <Link to="/register" className="font-semibold text-navy-900 hover:text-gold-600 transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
