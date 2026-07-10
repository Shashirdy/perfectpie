import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import { useSocket } from '../context/SocketContext';
import { Pizza, ShoppingCart, Bell, LogOut, User, Settings, ShieldAlert, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

export default function Navbar() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const { items } = useSelector((state) => state.cart);
  const { notifications, setNotifications } = useSocket();

  const [showBellMenu, setShowBellMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update state local
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const markSingleAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await axios.put(`http://localhost:5000/api/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error('Error marking notification read:', err);
    }
  };

  return (
    <nav className="glass sticky top-0 z-40 w-full border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
      {/* Brand Logo */}
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-pizza-500 p-2 rounded-xl text-dark-950 group-hover:rotate-12 transition-all duration-300">
          <Pizza size={22} className="fill-dark-950" />
        </div>
        <div>
          <span className="font-extrabold text-xl tracking-tight text-white">Perfect</span>
          <span className="font-extrabold text-xl tracking-tight text-pizza-500">Pie</span>
        </div>
      </Link>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link to="/" className="text-dark-200 hover:text-pizza-400 transition-colors">Catalog</Link>
        <Link to="/customizer" className="text-dark-200 hover:text-pizza-400 transition-colors">3D Custom Builder</Link>
        {isAuthenticated && user?.role === 'customer' && (
          <Link to="/my-orders" className="text-dark-200 hover:text-pizza-400 transition-colors">Order History</Link>
        )}
        {isAuthenticated && user?.role === 'admin' && (
          <Link to="/admin" className="text-pizza-400 hover:text-pizza-300 font-bold flex items-center gap-1.5">
            <Settings size={16} /> Admin panel
          </Link>
        )}
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            {/* Email Verification Banner (Micro) */}
            {!user?.isVerified && (
              <div className="hidden lg:flex items-center gap-1 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2.5 py-1 rounded-full animate-pulse">
                <ShieldAlert size={12} />
                Unverified Email
              </div>
            )}

            {/* Shopping Cart Button */}
            {user?.role === 'customer' && (
              <Link to="/cart" className="relative p-2.5 rounded-full hover:bg-white/5 transition-colors text-white group">
                <ShoppingCart size={20} className="group-hover:scale-110 transition-transform" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-pizza-500 text-dark-950 font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Notifications Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowBellMenu(!showBellMenu);
                  setShowProfileMenu(false);
                }}
                className="relative p-2.5 rounded-full hover:bg-white/5 transition-colors text-white"
              >
                <Bell size={20} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-pizza-500 animate-ping"></span>
                )}
              </button>

              {showBellMenu && (
                <div className="absolute right-0 mt-3 w-80 glass rounded-2xl shadow-2xl p-4 border border-white/10 z-50 text-sm max-h-[400px] overflow-y-auto">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-2">
                    <span className="font-bold text-white">Notifications</span>
                    {unreadNotifications.length > 0 && (
                      <button onClick={markAllAsRead} className="text-xs text-pizza-400 hover:text-pizza-300 font-semibold">
                        Mark all read
                      </button>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-xs text-dark-400 text-center py-6">No new notifications</p>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {notifications.map((n) => (
                        <div
                          key={n._id || Math.random()}
                          onClick={() => n._id && markSingleAsRead(n._id)}
                          className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                            n.isRead ? 'opacity-65 hover:bg-white/5' : 'bg-pizza-500/10 border-l-2 border-pizza-500 hover:bg-pizza-500/15'
                          }`}
                        >
                          <p className="text-xs text-white leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-dark-400 mt-1 block">
                            {n.createdAt ? new Date(n.createdAt).toLocaleTimeString() : 'Just now'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowBellMenu(false);
                }}
                className="flex items-center gap-2 hover:bg-white/5 p-1.5 pl-3 rounded-full transition-colors border border-white/5"
              >
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-white leading-none">{user.name}</p>
                  <span className="text-[10px] text-pizza-400 capitalize">{user.role}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-pizza-500 text-dark-950 flex items-center justify-center font-extrabold text-sm uppercase">
                  {user.name.slice(0, 2)}
                </div>
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 glass rounded-2xl shadow-2xl p-2 border border-white/10 z-50 text-sm">
                  <div className="px-4 py-2 border-b border-white/5 text-xs text-dark-400">
                    Logged in as <br />
                    <strong className="text-white">{user.email}</strong>
                  </div>
                  
                  {user?.role === 'admin' && (
                    <Link
                      to="/admin"
                      onClick={() => setShowProfileMenu(false)}
                      className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl hover:bg-pizza-500/10 hover:text-pizza-400 text-dark-200 transition-colors text-left font-medium mt-1"
                    >
                      <Settings size={16} /> Admin Panel
                    </Link>
                  )}
                  
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      handleLogout();
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 rounded-xl hover:bg-red-500/10 hover:text-red-400 text-dark-200 transition-colors text-left font-medium mt-1"
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-semibold text-dark-200 hover:text-white px-4 py-2">
              Login
            </Link>
            <Link to="/register" className="text-sm font-black bg-pizza-500 hover:bg-pizza-600 text-dark-950 px-5 py-2.5 rounded-xl transition-all shadow-md shadow-pizza-500/20 hover:scale-[1.02]">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
