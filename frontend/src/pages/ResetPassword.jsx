import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Pizza, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('Password reset token is missing. Please request a new link.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/auth/reset-password/${token}`, { password });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md glass p-8 rounded-3xl shadow-2xl border border-white/5 relative overflow-hidden">
        <div className="text-center mb-8">
          <div className="inline-flex bg-pizza-500 p-3 rounded-2xl text-dark-950 mb-3">
            <Pizza size={28} className="fill-dark-950" />
          </div>
          <h2 className="text-2xl font-black text-white">Create New Password</h2>
          <p className="text-xs text-dark-400 mt-1">Please enter your new secure password details</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs mb-6 flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="text-center py-4">
            <div className="inline-flex bg-green-500/20 text-green-400 p-3.5 rounded-full mb-4">
              <CheckCircle2 size={28} />
            </div>
            <h4 className="font-bold text-white mb-2">Password Updated!</h4>
            <p className="text-xs text-dark-300 leading-relaxed">
              Your password has been changed successfully. Redirecting you to login...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-dark-300 block mb-1.5 pl-1">New Password</label>
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
              <label className="text-xs font-semibold text-dark-300 block mb-1.5 pl-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-pizza-500 focus:ring-1 focus:ring-pizza-500 transition-all placeholder:text-dark-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-pizza-500 hover:bg-pizza-600 disabled:opacity-50 text-dark-950 font-black py-3.5 rounded-xl text-sm transition-all duration-300 hover:scale-[1.01]"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
