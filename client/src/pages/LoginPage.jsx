import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { HiLockClosed, HiMail, HiArrowRight, HiSparkles } from 'react-icons/hi';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  useEffect(() => {
    if (user) {
      if (user.role === 'farmer') navigate('/farmer/dashboard');
      else if (user.role === 'operator') navigate('/operator/dashboard');
      else if (user.role === 'admin') navigate('/admin/dashboard');
    }
  }, [user, navigate]);

  // Handle URL query role prefill (e.g. ?role=farmer)
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam === 'farmer') {
      setEmail('9811111111');
      setPassword('farmer123');
    } else if (roleParam === 'operator') {
      setEmail('9111111111');
      setPassword('operator123');
    } else if (roleParam === 'admin') {
      setEmail('9999999999');
      setPassword('admin123');
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter mobile and password');
      return;
    }

    try {
      setLoading(true);
      const res = await login({ mobile: email, email, password });
      const loggedUser = res.user || res;
      toast.success(`Welcome back, ${loggedUser.name || 'User'}!`);

      const destination = location.state?.from?.pathname;
      if (destination) {
        navigate(destination);
      } else if (loggedUser.role === 'farmer') {
        navigate('/farmer/dashboard');
      } else if (loggedUser.role === 'operator') {
        navigate('/operator/dashboard');
      } else if (loggedUser.role === 'admin') {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    if (role === 'farmer') {
      setEmail('9811111111');
      setPassword('farmer123');
    } else if (role === 'operator') {
      setEmail('9111111111');
      setPassword('operator123');
    } else if (role === 'admin') {
      setEmail('9999999999');
      setPassword('admin123');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mx-auto text-white text-2xl shadow-xs">
            🌾
          </div>
          <h2 className="mt-4 text-2xl font-extrabold text-slate-900 tracking-tight">
            Sign in to Kisan<span className="text-emerald-600">Setu</span>
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Smart Mandi Procurement & Queue Management Portal
          </p>
        </div>

        {/* 1-Click Demo Login Bar */}
        <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-2">
            <HiSparkles className="w-4 h-4 text-emerald-600" />
            <span>SIH 2026 1-Click Evaluation Accounts</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillDemo('farmer')}
              className="py-1.5 px-2 bg-white rounded-lg text-[11px] font-semibold text-emerald-800 border border-emerald-300 hover:bg-emerald-100/50 shadow-xs cursor-pointer"
            >
              🧑‍🌾 Farmer
            </button>
            <button
              type="button"
              onClick={() => fillDemo('operator')}
              className="py-1.5 px-2 bg-white rounded-lg text-[11px] font-semibold text-teal-800 border border-teal-300 hover:bg-teal-100/50 shadow-xs cursor-pointer"
            >
              🏭 Mandi Staff
            </button>
            <button
              type="button"
              onClick={() => fillDemo('admin')}
              className="py-1.5 px-2 bg-white rounded-lg text-[11px] font-semibold text-amber-900 border border-amber-300 hover:bg-amber-100/50 shadow-xs cursor-pointer"
            >
              🏛️ Admin / IAS
            </button>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Email or Mobile Number
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <HiMail className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com or 9876543210"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <HiLockClosed className="w-5 h-5 text-emerald-600" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Portal</span>
                <HiArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 text-xs text-slate-600">
          <span>New Farmer? </span>
          <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline">
            Register for Free Mandi Token
          </Link>
        </div>
      </div>
    </div>
  );
}
