import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../store/authSlice';
import { Pizza, Eye, EyeOff, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function Login() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    dispatch(authStart());
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { email, password });
      if (res.data.success) {
        dispatch(authSuccess({ user: res.data.user, token: res.data.token }));
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      dispatch(authFailure(errMsg));
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-pizza-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pizza-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-8">
          <div className="inline-flex bg-pizza-500 p-3 rounded-2xl text-dark-950 mb-3 shadow-lg shadow-pizza-500/20">
            <Pizza size={28} className="fill-dark-950" />
          </div>
          <h2 className="text-2xl font-black text-white">Welcome Back</h2>
          <p className="text-xs text-dark-400 mt-1">Savor the perfect slice customized by you</p>
        </div>

        {(localError || error) && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs mb-6 flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-dark-300 block mb-1.5 pl-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. chef@perfectpie.com"
              className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-pizza-500 focus:ring-1 focus:ring-pizza-500 transition-all placeholder:text-dark-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5 pl-1">
              <label className="text-xs font-semibold text-dark-300">Password</label>
              <Link to="/forgot-password" className="text-xs text-pizza-400 hover:text-pizza-300 font-medium">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 pl-4 pr-11 text-sm text-white focus:outline-none focus:border-pizza-500 focus:ring-1 focus:ring-pizza-500 transition-all placeholder:text-dark-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-dark-500 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-pizza-500 hover:bg-pizza-600 disabled:opacity-50 text-dark-950 font-black py-3.5 rounded-xl text-sm transition-all duration-300 hover:scale-[1.01] shadow-lg shadow-pizza-500/10"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <p className="text-xs text-dark-400 text-center mt-8">
          Don't have an account?{' '}
          <Link to="/register" className="text-pizza-400 hover:text-pizza-300 font-bold">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
