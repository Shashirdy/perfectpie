import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  removeFromCart,
  updateQuantity,
  saveForLater,
  moveToCart,
  removeFromSaved,
  applyCoupon,
  removeCoupon,
  clearCart,
} from '../store/cartSlice';
import { addOrderToList } from '../store/orderSlice';
import { Trash2, Heart, Tag, ArrowRight, X, CreditCard, ShieldCheck, AlertCircle, ShoppingBag, Landmark } from 'lucide-react';
import axios from 'axios';

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { isAuthenticated } = useSelector((state) => state.auth);
  const { items, savedForLater, subtotal, discount, total, appliedCoupon } = useSelector((state) => state.cart);

  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  
  // Checkout Modal states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [checkoutError, setCheckoutError] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  const handleQtyChange = (uniqueId, newQty) => {
    dispatch(updateQuantity({ uniqueId, quantity: newQty }));
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setCouponError('Please login to apply coupons.');
        return;
      }

      const res = await axios.post(
        'http://localhost:5000/api/coupons/validate',
        { code: couponCode, orderAmount: subtotal },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        const { code, discountType, discountValue, minOrderValue } = res.data.data;
        dispatch(applyCoupon({ code, discountType, discountValue, minOrderValue }));
        setCouponSuccess(`Coupon '${code}' applied successfully!`);
        setCouponCode('');
      }
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
    setCouponSuccess('');
  };

  // Mock Payment Flow Trigger
  const triggerMockPayment = async (status) => {
    if (!deliveryAddress || !phone) {
      setCheckoutError('Please provide delivery address and phone number.');
      return;
    }

    setCheckoutError('');
    setProcessingPayment(true);

    // Simulate Payment Gateway delay
    setTimeout(async () => {
      if (status === 'success') {
        try {
          const token = localStorage.getItem('token');
          // Prepare payload
          const payload = {
            pizzas: items.map((i) => ({
              name: i.name,
              base: i.base,
              sauce: i.sauce,
              cheese: i.cheese,
              veggies: i.veggies,
              price: i.price,
              quantity: i.quantity,
            })),
            totalAmount: subtotal,
            discountAmount: discount,
            finalAmount: total,
            deliveryAddress,
            phone,
            paymentDetails: {
              paymentId: 'pay_mock_' + Math.random().toString(36).substr(2, 9),
              signature: 'sig_mock_' + Math.random().toString(36).substr(2, 16),
              method: paymentMethod,
            },
          };

          const res = await axios.post('http://localhost:5000/api/orders', payload, {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (res.data.success) {
            dispatch(addOrderToList(res.data.order));
            dispatch(clearCart());
            setShowCheckoutModal(false);
            setProcessingPayment(false);
            
            // Redirect to active tracking page
            navigate(`/tracking?orderId=${res.data.order._id}`);
          }
        } catch (err) {
          setCheckoutError(err.response?.data?.message || 'Server error placing order. Check stock levels.');
          setProcessingPayment(false);
        }
      } else {
        // Payment Failure Simulation
        setCheckoutError('Payment failed: Card declined / UPI transaction timed out. (Test Mode)');
        setProcessingPayment(false);
      }
    }, 1500);
  };

  if (items.length === 0 && savedForLater.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <div className="bg-white/3 p-6 rounded-full text-dark-500 mb-4 border border-white/5 animate-pulse">
          <ShoppingBag size={48} />
        </div>
        <h2 className="text-xl font-black text-white">Your Shopping Cart is Empty</h2>
        <p className="text-xs text-dark-400 mt-2 max-w-sm">
          A delicious pizza awaits. Build your customized 3D pizza or choose from our catalogs today!
        </p>
        <div className="flex gap-4 mt-8">
          <Link to="/" className="glass hover:bg-white/5 border border-white/10 text-xs font-semibold px-5 py-3 rounded-xl transition-all">
            Browse Presets
          </Link>
          <Link to="/customizer" className="bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-pizza-500/10">
            Start 3D Builder
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 md:px-12 py-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-black text-white mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Cart Items List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="glass rounded-3xl p-6 text-center text-xs text-dark-400">
              Active cart is empty. Check your "Saved for Later" shelf below!
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.uniqueId}
                  className="glass rounded-2xl p-4 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-pizza-500/10 text-pizza-500 flex items-center justify-center font-extrabold shadow-inner shrink-0 border border-pizza-500/15">
                      🍕
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{item.name}</h4>
                      <p className="text-[10px] text-dark-400 mt-1 leading-relaxed">
                        Crust: <span className="text-pizza-400 font-semibold">{item.base}</span> | Sauce: <span className="text-pizza-400 font-semibold">{item.sauce}</span> | Cheese: <span className="text-pizza-400 font-semibold">{item.cheese}</span>
                      </p>
                      {item.veggies.length > 0 && (
                        <p className="text-[10px] text-green-400 mt-0.5 leading-relaxed">
                          Toppings: {item.veggies.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity adjustments & pricing */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-3 sm:pt-0">
                    <div className="flex items-center gap-2 bg-dark-900 border border-white/5 px-2 py-1 rounded-xl">
                      <button
                        onClick={() => handleQtyChange(item.uniqueId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="text-dark-400 hover:text-white px-2 py-0.5 font-bold disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-white px-1">{item.quantity}</span>
                      <button
                        onClick={() => handleQtyChange(item.uniqueId, item.quantity + 1)}
                        className="text-dark-400 hover:text-white px-2 py-0.5 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-black text-white">${(item.price * item.quantity).toFixed(2)}</p>
                      <p className="text-[10px] text-dark-500 mt-0.5">${item.price.toFixed(2)} each</p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => dispatch(saveForLater(item.uniqueId))}
                        className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-pizza-400 transition-colors"
                        title="Save for Later"
                      >
                        <Heart size={15} />
                      </button>
                      <button
                        onClick={() => dispatch(removeFromCart(item.uniqueId))}
                        className="p-2 rounded-lg hover:bg-white/5 text-dark-400 hover:text-red-400 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Saved For Later Section */}
          {savedForLater.length > 0 && (
            <div className="mt-8 border-t border-white/5 pt-6">
              <h3 className="font-extrabold text-base text-white mb-4">Saved for Later</h3>
              <div className="flex flex-col gap-4">
                {savedForLater.map((item) => (
                  <div
                    key={item.uniqueId}
                    className="glass opacity-75 hover:opacity-100 rounded-2xl p-4 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300"
                  >
                    <div>
                      <h4 className="font-bold text-sm text-white">{item.name}</h4>
                      <p className="text-[10px] text-dark-400 mt-1">
                        Base: {item.base} | Cheese: {item.cheese}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-white">${item.price.toFixed(2)}</span>
                      <button
                        onClick={() => dispatch(moveToCart(item.uniqueId))}
                        className="bg-pizza-500/10 hover:bg-pizza-500 text-pizza-400 hover:text-dark-950 border border-pizza-500/20 text-xs font-semibold px-4 py-2 rounded-xl transition-all"
                      >
                        Move to Cart
                      </button>
                      <button
                        onClick={() => dispatch(removeFromSaved(item.uniqueId))}
                        className="p-2 text-dark-400 hover:text-red-400"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Cart Summary Panel */}
        {items.length > 0 && (
          <div className="lg:col-span-4 flex flex-col gap-6">
            {/* Promo coupon form */}
            <div className="glass rounded-2xl p-5 border border-white/5">
              <h3 className="font-bold text-sm text-white mb-3 flex items-center gap-1.5">
                <Tag size={15} className="text-pizza-500" /> Apply Coupon
              </h3>
              
              {couponError && <p className="text-[10px] text-red-400 font-medium mb-2">{couponError}</p>}
              {couponSuccess && <p className="text-[10px] text-green-400 font-medium mb-2">{couponSuccess}</p>}

              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-pizza-500/5 border border-pizza-500/20 p-3 rounded-xl">
                  <div>
                    <span className="text-xs font-extrabold text-pizza-400 uppercase tracking-wide">
                      {appliedCoupon.code}
                    </span>
                    <p className="text-[9px] text-dark-400 mt-0.5">Applied discount successfully</p>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-dark-400 hover:text-white">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Coupon (e.g. PIZZA20)"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    className="flex-1 bg-dark-900 border border-white/5 px-3 py-2 rounded-xl text-xs text-white uppercase focus:outline-none placeholder:text-dark-600"
                  />
                  <button
                    type="submit"
                    className="bg-white/5 hover:bg-white/10 text-xs font-semibold px-4 py-2 rounded-xl transition-all border border-white/10"
                  >
                    Apply
                  </button>
                </form>
              )}
            </div>

            {/* Price calculation summary */}
            <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
              <h3 className="font-extrabold text-base text-white border-b border-white/5 pb-3">Order Summary</h3>

              <div className="flex justify-between items-center text-xs text-dark-300">
                <span>Subtotal</span>
                <span className="text-white">${subtotal.toFixed(2)}</span>
              </div>

              {discount > 0 && (
                <div className="flex justify-between items-center text-xs text-green-400 font-semibold">
                  <span>Coupon Discount</span>
                  <span>-${discount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center text-xs text-dark-300">
                <span>Delivery Charge</span>
                <span className="text-green-400 font-bold">FREE</span>
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between items-center">
                <span className="font-bold text-sm text-white">Total Amount</span>
                <span className="font-black text-xl text-pizza-400">${total.toFixed(2)}</span>
              </div>

              {isAuthenticated ? (
                <button
                  onClick={() => setShowCheckoutModal(true)}
                  className="w-full mt-4 bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black py-4 rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-pizza-500/10 transition-all hover:scale-[1.01]"
                >
                  Proceed to Checkout <ArrowRight size={16} />
                </button>
              ) : (
                <div className="mt-4 text-center">
                  <Link
                    to="/login"
                    className="w-full inline-block bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black py-4 rounded-xl text-sm transition-all"
                  >
                    Login to Checkout
                  </Link>
                  <p className="text-[10px] text-dark-500 mt-2">Required to configure addresses and process payments</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. Mock Razorpay Payment Modal Checkout Overlay */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/85 backdrop-blur-sm">
          <div className="w-full max-w-md glass border border-white/10 rounded-3xl p-6 shadow-2xl relative text-sm overflow-hidden">
            
            {/* Header banner */}
            <div className="bg-pizza-500/10 border-b border-pizza-500/20 p-4 -mx-6 -mt-6 mb-6 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-pizza-400" size={18} />
                <span className="font-black text-white text-xs tracking-wider uppercase">Razorpay Secure Checkout (Test Mode)</span>
              </div>
              <button
                onClick={() => !processingPayment && setShowCheckoutModal(false)}
                className="text-dark-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {checkoutError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-xs mb-4 flex items-start gap-2.5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <span>{checkoutError}</span>
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-dark-300 block mb-1.5 pl-1">Delivery Address</label>
                <textarea
                  rows="2"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Street name, Appt number, City, Zipcode"
                  className="w-full bg-dark-900 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pizza-500 placeholder:text-dark-600"
                ></textarea>
              </div>

              <div>
                <label className="text-xs font-bold text-dark-300 block mb-1.5 pl-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-pizza-500 placeholder:text-dark-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-dark-300 block mb-2 pl-1">Payment Method</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'card', name: 'Card', icon: <CreditCard size={14} /> },
                    { id: 'upi', name: 'UPI', icon: <span className="font-bold text-[10px]">UPI</span> },
                    { id: 'netbank', name: 'Net Banking', icon: <Landmark size={14} /> },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 justify-center transition-all ${
                        paymentMethod === m.id
                          ? 'bg-pizza-500/10 border-pizza-500 text-white font-bold'
                          : 'bg-dark-900/60 border-white/5 text-dark-300 hover:border-white/10'
                      }`}
                    >
                      {m.icon}
                      <span className="text-[10px]">{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount display */}
              <div className="bg-dark-900 border border-white/5 p-3 rounded-xl flex justify-between items-center mt-2">
                <span className="text-xs text-dark-400 font-bold">Total Amount Payable</span>
                <span className="font-black text-pizza-400 text-base">${total.toFixed(2)}</span>
              </div>

              {/* Checkout actions */}
              <div className="flex gap-3 mt-4">
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => triggerMockPayment('fail')}
                  className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold py-3.5 rounded-xl text-xs transition-all border border-red-500/25 active:scale-98 disabled:opacity-50"
                >
                  Fail Payment
                </button>
                <button
                  type="button"
                  disabled={processingPayment}
                  onClick={() => triggerMockPayment('success')}
                  className="flex-1 bg-pizza-500 hover:bg-pizza-600 disabled:opacity-50 text-dark-950 font-black py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-pizza-500/10 active:scale-98"
                >
                  {processingPayment ? 'Processing...' : 'Pay Successfully'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
