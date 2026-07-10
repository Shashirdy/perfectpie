import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { authStart, authSuccess, authFailure } from '../store/authSlice';
import { Pizza, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function Register() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer'); // Default to customer
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

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

    if (!name || !email || !password) {
      setLocalError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    dispatch(authStart());
    try {
      const res = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        role,
      });

      if (res.data.success) {
        setRegisteredSuccess(true);
        // We do not immediately trigger authSuccess so the user sees the "verify email" notice screen
        // But we can let them login or show verification prompt. 
        // Let's set a timer or let them click log in.
        dispatch(authFailure(null)); // Clear loading/errors
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || 'Registration failed. Please check inputs.';
      dispatch(authFailure(errMsg));
    }
  };

  if (registeredSuccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl border border-white/5 text-center">
          <div className="inline-flex bg-green-500/20 text-green-400 p-4 rounded-full mb-4 animate-bounce">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-2xl font-black text-white">Registration Successful!</h2>
          <p className="text-sm text-dark-300 mt-3 leading-relaxed">
            A verification link has been sent to <strong className="text-white">{email}</strong>.
          </p>
          <p className="text-xs text-dark-400 mt-2 leading-relaxed">
            Please check your inbox (and spam folder) to activate your account.
          </p>
          <div className="mt-8 border-t border-white/5 pt-6">
            <Link
              to="/login"
              className="inline-block bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black px-6 py-3 rounded-xl text-sm transition-all duration-300"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-pizza-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-pizza-500/10 rounded-full blur-3xl"></div>

        <div className="text-center mb-8">
          <div className="inline-flex bg-pizza-500 p-3 rounded-2xl text-dark-950 mb-3">
            <Pizza size={28} className="fill-dark-950" />
          </div>
          <h2 className="text-2xl font-black text-white">Create Account</h2>
          <p className="text-xs text-dark-400 mt-1">Get access to custom 3D builders & live tracking</p>
        </div>

        {(localError || error) && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs mb-6 flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{localError || error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-dark-300 block mb-1.5 pl-1">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yathin Shashi"
              className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-pizza-500 focus:ring-1 focus:ring-pizza-500 transition-all placeholder:text-dark-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-dark-300 block mb-1.5 pl-1">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. customer@perfectpie.com"
              className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-pizza-500 focus:ring-1 focus:ring-pizza-500 transition-all placeholder:text-dark-600"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-dark-300 block mb-1.5 pl-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
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

          <div>
            <label className="text-xs font-semibold text-dark-300 block mb-1.5 pl-1">Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-pizza-500 focus:ring-1 focus:ring-pizza-500 transition-all cursor-pointer"
            >
              <option value="customer">Customer (Order & Build)</option>
              <option value="admin">Administrator (Dashboard & Stock)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-pizza-500 hover:bg-pizza-600 disabled:opacity-50 text-dark-950 font-black py-3.5 rounded-xl text-sm transition-all duration-300 hover:scale-[1.01] shadow-lg shadow-pizza-500/10"
          >
            {loading ? 'Registering Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-xs text-dark-400 text-center mt-8">
          Already have an account?{' '}
          <Link to="/login" className="text-pizza-400 hover:text-pizza-300 font-bold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
