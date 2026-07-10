import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveOrder } from '../store/orderSlice';
import { Pizza, Compass, Calendar, Phone, MapPin, CheckCircle, Package, Truck, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function Tracking() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const dispatch = useDispatch();

  const { activeOrder } = useSelector((state) => state.orders);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrderDetails = async () => {
    if (!orderId) {
      setError('No order ID specified for tracking.');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.success) {
        dispatch(setActiveOrder(res.data.data));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();

    // Clean up active order on unmount
    return () => {
      dispatch(setActiveOrder(null));
    };
  }, [orderId]);

  // Order tracking status steps config
  const statusSteps = [
    { name: 'Received', label: 'Order Received', desc: 'We have received your custom order', icon: <Calendar size={18} /> },
    { name: 'Preparing', label: 'Preparing', desc: 'Toppings are being gathered', icon: <Pizza size={18} /> },
    { name: 'Baking', label: 'Baking', desc: 'Pizza is baking in hot ovens', icon: <Sparkles size={18} /> },
    { name: 'Packaging', label: 'Packaging', desc: 'Cardboard box and spice sachets ready', icon: <Package size={18} /> },
    { name: 'Out for Delivery', label: 'Out for Delivery', desc: 'Rider carrying hot pizza to you', icon: <Truck size={18} /> },
    { name: 'Delivered', label: 'Delivered', desc: 'Pizza hand-delivered. Bon appétit!', icon: <CheckCircle size={18} /> },
  ];

  const getStepIndex = (status) => {
    return statusSteps.findIndex((s) => s.name === status);
  };

  const currentStepIdx = activeOrder ? getStepIndex(activeOrder.status) : 0;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-center">
        <div className="lds-ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div>
      </div>
    );
  }

  if (error || !activeOrder) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <Compass className="text-dark-600 mb-3" size={48} />
        <h2 className="text-xl font-bold text-white">Tracking Error</h2>
        <p className="text-xs text-dark-400 mt-2 max-w-sm">{error || 'Could not find the requested order.'}</p>
        <Link to="/" className="mt-6 bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black text-xs px-5 py-2.5 rounded-xl transition-all">
          Back to Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-8 max-w-5xl mx-auto flex flex-col gap-8">
      {/* Tracker Page Header */}
      <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="bg-pizza-500/10 text-pizza-400 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
            Live tracking active
          </span>
          <h2 className="text-2xl font-black text-white mt-2">Order #{activeOrder._id.slice(-8).toUpperCase()}</h2>
          <p className="text-[10px] text-dark-400 mt-0.5">Placed: {new Date(activeOrder.createdAt).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-dark-400">Final Paid amount</p>
          <p className="text-xl font-black text-pizza-400">${activeOrder.finalAmount.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Tracker status stepper */}
        <div className="lg:col-span-8 glass rounded-3xl p-6 md:p-8 border border-white/5">
          <h3 className="font-extrabold text-lg text-white mb-8">Cooking & Delivery Progress</h3>
          
          {/* Stepper block */}
          <div className="relative pl-8 border-l border-white/5 flex flex-col gap-10">
            {statusSteps.map((step, idx) => {
              const isCompleted = currentStepIdx >= idx;
              const isActive = currentStepIdx === idx;
              
              // Find matching timestamp in logs if completed
              const matchingLog = activeOrder.statusLogs.find((l) => l.status === step.name);
              const logTime = matchingLog ? new Date(matchingLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

              return (
                <div key={step.name} className="relative">
                  {/* Circular step badge */}
                  <div className={`absolute -left-[45px] top-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 ${
                    isActive
                      ? 'bg-pizza-500 border-pizza-500 text-dark-950 scale-110 shadow-lg shadow-pizza-500/20'
                      : isCompleted
                      ? 'bg-green-500/20 border-green-500 text-green-400'
                      : 'bg-dark-950 border-white/5 text-dark-600'
                  }`}>
                    {step.icon}
                  </div>

                  {/* Step descriptions */}
                  <div>
                    <div className="flex items-center justify-between gap-4">
                      <h4 className={`text-sm font-bold transition-colors duration-500 ${
                        isActive ? 'text-pizza-400 text-base' : isCompleted ? 'text-white' : 'text-dark-400'
                      }`}>
                        {step.label}
                      </h4>
                      {logTime && (
                        <span className="bg-white/3 text-dark-400 text-[10px] px-2.5 py-0.5 rounded-full">
                          {logTime}
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 transition-colors duration-500 ${
                      isActive || isCompleted ? 'text-dark-300' : 'text-dark-600'
                    }`}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Order details sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Pizza items configured */}
          <div className="glass rounded-2xl p-5 border border-white/5">
            <h3 className="font-bold text-sm text-white mb-4 border-b border-white/5 pb-2">Order Configuration</h3>
            <div className="flex flex-col gap-4">
              {activeOrder.pizzas.map((p, i) => (
                <div key={i} className="text-xs">
                  <div className="flex justify-between items-center font-bold text-white">
                    <span>{p.name}</span>
                    <span>x{p.quantity}</span>
                  </div>
                  <p className="text-dark-400 mt-1 leading-relaxed">
                    Base: {p.base} | Cheese: {p.cheese}
                  </p>
                  {p.veggies.length > 0 && (
                    <p className="text-green-400 mt-0.5 leading-relaxed">
                      Toppings: {p.veggies.join(', ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Delivery destination card */}
          <div className="glass rounded-2xl p-5 border border-white/5 flex flex-col gap-4 text-xs">
            <h3 className="font-bold text-sm text-white border-b border-white/5 pb-2">Delivery Details</h3>
            
            <div className="flex gap-2.5 items-start">
              <MapPin size={16} className="text-pizza-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-dark-400 font-semibold mb-0.5">Address</p>
                <p className="text-white leading-relaxed">{activeOrder.deliveryAddress}</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-center">
              <Phone size={16} className="text-pizza-400 shrink-0" />
              <div>
                <p className="text-dark-400 font-semibold mb-0.5">Contact Number</p>
                <p className="text-white">{activeOrder.phone}</p>
              </div>
            </div>

            <div className="flex gap-2.5 items-center">
              <Compass size={16} className="text-pizza-400 shrink-0" />
              <div>
                <p className="text-dark-400 font-semibold mb-0.5">Payment Method</p>
                <p className="text-white capitalize">{activeOrder.paymentDetails?.method || 'UPI (Mock)'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
