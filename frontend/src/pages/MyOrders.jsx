import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Clock, ShieldCheck, MapPin, Compass } from 'lucide-react';
import axios from 'axios';

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve order history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-8 max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-black text-white">Order History</h1>
        <p className="text-xs text-dark-400 mt-1">Review past order invoices and track ongoing deliveries</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
          {error}
        </div>
      )}

      {orders.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center text-xs text-dark-400 flex flex-col items-center gap-3">
          <Clock size={32} className="text-dark-600" />
          <p className="font-bold text-white">No Orders Placed Yet</p>
          <p className="max-w-xs">You haven't ordered any pizzas yet. Head over to our catalog or build one customized!</p>
          <Link to="/" className="mt-4 bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black px-5 py-2.5 rounded-xl transition-all">
            Browse Pizzas
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => (
            <div
              key={o._id}
              className="glass rounded-2xl p-5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-white/10 transition-colors"
            >
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-sm text-pizza-400">#{o._id.slice(-8).toUpperCase()}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    o.status === 'Delivered'
                      ? 'bg-green-500/10 text-green-400'
                      : o.status === 'Received'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {o.status}
                  </span>
                </div>
                <p className="text-[10px] text-dark-500 mt-1">Ordered on: {new Date(o.createdAt).toLocaleString()}</p>
                
                {/* Pizzas description */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {o.pizzas.map((p, idx) => (
                    <span key={idx} className="bg-white/3 text-dark-300 text-[10px] px-2.5 py-1 rounded-lg">
                      {p.name} (x{p.quantity})
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 border-t md:border-t-0 border-white/5 pt-3 md:pt-0">
                <div className="text-left md:text-right">
                  <p className="text-[10px] text-dark-400">Total amount paid</p>
                  <p className="text-lg font-black text-white">${o.finalAmount.toFixed(2)}</p>
                </div>
                
                <Link
                  to={`/tracking?orderId=${o._id}`}
                  className="bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-pizza-500/5 flex items-center gap-1.5"
                >
                  <Compass size={14} /> Track Delivery
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
