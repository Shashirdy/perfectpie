import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Pizza, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please provide your email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/api/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccess(true);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request password reset. Try again.');
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
          <h2 className="text-2xl font-black text-white">Reset Password</h2>
          <p className="text-xs text-dark-400 mt-1">We'll email you a secure link to update your password</p>
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
            <h4 className="font-bold text-white mb-2">Check Your Email</h4>
            <p className="text-xs text-dark-300 leading-relaxed mb-6">
              A password reset link has been sent to <br />
              <strong className="text-white">{email}</strong>.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-xs text-pizza-400 hover:text-pizza-300 font-bold border border-pizza-500/30 hover:border-pizza-500 px-5 py-2.5 rounded-xl transition-all"
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-semibold text-dark-300 block mb-1.5 pl-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@perfectpie.com"
                className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-pizza-500 focus:ring-1 focus:ring-pizza-500 transition-all placeholder:text-dark-600"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-pizza-500 hover:bg-pizza-600 disabled:opacity-50 text-dark-950 font-black py-3.5 rounded-xl text-sm transition-all duration-300 hover:scale-[1.01]"
            >
              {loading ? 'Sending Request...' : 'Send Reset Link'}
            </button>

            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 text-xs text-dark-400 hover:text-white mt-4 font-semibold transition-colors"
            >
              <ArrowLeft size={14} /> Back to Login
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}
