import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useSelector, useDispatch } from 'react-redux';
import { updateActiveOrderStatus } from '../store/orderSlice';
import { updateStockCount } from '../store/inventorySlice';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [newOrderToast, setNewOrderToast] = useState(null);
  
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { activeOrder } = useSelector((state) => state.orders);

  useEffect(() => {
    // Connect to Backend Socket Server
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const newSocket = io(backendUrl, {
      withCredentials: true,
      autoConnect: true,
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  // Listen to events when user logs in or active order changes
  useEffect(() => {
    if (!socket) return;

    // Join user channel
    if (user) {
      socket.emit('join_user', user.id);
      
      if (user.role === 'admin') {
        socket.emit('join_admins');
      }

      // Listen for notifications
      const userNotificationEvent = `notification_${user.id}`;
      socket.on(userNotificationEvent, (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        // Trigger a temporary visual toast
        triggerToast(notification.message);
      });
    }

    // Listen for new orders (Admin room)
    socket.on('new_order', (order) => {
      if (user?.role === 'admin') {
        setNewOrderToast(order);
        setNotifications((prev) => [
          { message: `New order #${order.id.slice(-6)} placed for $${order.finalAmount}`, createdAt: new Date() },
          ...prev,
        ]);
        setTimeout(() => setNewOrderToast(null), 8000);
      }
    });

    return () => {
      if (user) {
        socket.off(`notification_${user.id}`);
      }
      socket.off('new_order');
    };
  }, [socket, user]);

  // Listen for specific active order status changes
  useEffect(() => {
    if (!socket || !activeOrder) return;

    const orderStatusEvent = `order_status_${activeOrder._id}`;
    socket.on(orderStatusEvent, (data) => {
      // data contains: { status, statusLogs }
      dispatch(updateActiveOrderStatus(data));
      triggerToast(`Order status updated to: ${data.status}`);
    });

    return () => {
      socket.off(orderStatusEvent);
    };
  }, [socket, activeOrder, dispatch]);

  const [toastMessage, setToastMessage] = useState(null);
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, setNotifications, toastMessage, newOrderToast, setNewOrderToast }}>
      {children}
      
      {/* Real-time Toast Notification Overlay */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 glass border-l-4 border-pizza-500 text-white px-5 py-4 rounded-lg shadow-2xl flex items-center gap-3 animate-bounce">
          <div className="w-2 h-2 rounded-full bg-pizza-500 animate-ping"></div>
          <div>
            <p className="text-xs font-semibold uppercase text-pizza-400">Update</p>
            <p className="text-sm font-medium">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* New Order Overlay Alert (Admin Only) */}
      {newOrderToast && (
        <div className="fixed top-6 right-6 z-50 glass border-2 border-green-500 bg-dark-900/90 text-white p-5 rounded-xl shadow-2xl w-80 animate-slide-in">
          <div className="flex justify-between items-start">
            <span className="bg-green-500/20 text-green-400 text-xs px-2.5 py-0.5 rounded-full font-bold">NEW ORDER</span>
            <button onClick={() => setNewOrderToast(null)} className="text-dark-400 hover:text-white text-lg">&times;</button>
          </div>
          <h4 className="font-bold mt-2 text-lg">Order #{newOrderToast.id.slice(-6)}</h4>
          <p className="text-sm text-dark-300 mt-1">Customer: {newOrderToast.customerName}</p>
          <p className="text-sm text-pizza-400 font-semibold mt-1">Amount: ${newOrderToast.finalAmount.toFixed(2)}</p>
          <button 
            onClick={() => {
              setNewOrderToast(null);
              // Router redirect to order list could be handled by parent
            }} 
            className="w-full mt-4 bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-bold py-2 rounded-lg text-sm transition-all duration-300"
          >
            Manage Order
          </button>
        </div>
      )}
    </SocketContext.Provider>
  );
};
