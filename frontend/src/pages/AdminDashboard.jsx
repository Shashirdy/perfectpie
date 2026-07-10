import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Settings,
  Plus,
  Edit2,
  Trash2,
  DollarSign,
  CheckCircle,
  Truck,
  Package,
  Activity,
  User
} from 'lucide-react';
import axios from 'axios';

export default function AdminDashboard() {
  const { user } = useSelector((state) => state.auth);

  // States
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    totalCustomers: 0,
    pendingOrders: 0,
    lowStockCount: 0,
    lowStockItems: [],
  });
  
  const [charts, setCharts] = useState({
    dailySales: [],
    monthlySales: [],
    popularIngredients: [],
  });

  const [orders, setOrders] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activeTab, setActiveTab] = useState('analytics'); // analytics, orders, inventory

  // Form states for inventory CRUD
  const [showItemModal, setShowItemModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // add, edit
  const [currentItemId, setCurrentItemId] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemType, setItemType] = useState('base');
  const [itemPrice, setItemPrice] = useState(1);
  const [itemStock, setItemStock] = useState(50);
  const [itemThreshold, setItemThreshold] = useState(20);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Load summary statistics and charts
  const loadAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [summaryRes, chartRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/summary', { headers }),
        axios.get('http://localhost:5000/api/analytics/charts', { headers }),
      ]);

      if (summaryRes.data.success) setSummary(summaryRes.data.data);
      if (chartRes.data.success) setCharts(chartRes.data.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    }
  };

  // Load orders list
  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setOrders(res.data.data);
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  };

  // Load inventory list
  const loadInventory = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/inventory');
      if (res.data.success) setInventory(res.data.data);
    } catch (err) {
      console.error('Error loading inventory:', err);
    }
  };

  const initData = async () => {
    setLoading(true);
    await Promise.all([loadAnalytics(), loadOrders(), loadInventory()]);
    setLoading(false);
  };

  useEffect(() => {
    initData();
  }, []);

  // Update order status trigger
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Update local orders state
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o))
        );
        loadAnalytics(); // Refresh analytics warnings
      }
    } catch (err) {
      alert('Error updating status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Inventory CRUD
  const handleInventorySubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const payload = {
        name: itemName,
        type: itemType,
        price: parseFloat(itemPrice),
        stock: parseInt(itemStock),
        threshold: parseInt(itemThreshold),
      };

      if (modalMode === 'add') {
        const res = await axios.post('http://localhost:5000/api/inventory', payload, { headers });
        if (res.data.success) {
          setInventory((prev) => [...prev, res.data.data]);
        }
      } else {
        const res = await axios.put(`http://localhost:5000/api/inventory/${currentItemId}`, payload, { headers });
        if (res.data.success) {
          setInventory((prev) => prev.map((item) => (item._id === currentItemId ? res.data.data : item)));
        }
      }

      setShowItemModal(false);
      loadAnalytics(); // Refresh low stock counts
    } catch (err) {
      alert(err.response?.data?.message || 'Error processing inventory item');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (item) => {
    setModalMode('edit');
    setCurrentItemId(item._id);
    setItemName(item.name);
    setItemType(item.type);
    setItemPrice(item.price);
    setItemStock(item.stock);
    setItemThreshold(item.threshold);
    setShowItemModal(true);
  };

  const handleDeleteClick = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this ingredient?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/inventory/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInventory((prev) => prev.filter((item) => item._id !== itemId));
      loadAnalytics();
    } catch (err) {
      alert('Failed to delete item.');
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setItemName('');
    setItemType('base');
    setItemPrice(1.00);
    setItemStock(50);
    setItemThreshold(20);
    setShowItemModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center">
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
    <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto flex flex-col gap-8">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Administrator Console</h1>
          <p className="text-xs text-dark-400 mt-1">Manage orders, stock monitoring, and view business analytics</p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-dark-900 border border-white/5 p-1 rounded-xl font-bold text-xs">
          {[
            { id: 'analytics', label: 'Analytics' },
            { id: 'orders', label: 'Orders Log' },
            { id: 'inventory', label: 'Stock Manager' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id ? 'bg-pizza-500 text-dark-950 font-black' : 'text-dark-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. Analytics tab */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col gap-8">
          {/* Summary grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Rev */}
            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <div className="bg-pizza-500/10 p-3.5 rounded-xl text-pizza-500">
                <DollarSign size={22} />
              </div>
              <div>
                <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Revenue</p>
                <h4 className="text-xl font-black text-white mt-0.5">${summary.totalRevenue.toFixed(2)}</h4>
              </div>
            </div>

            {/* Orders */}
            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <div className="bg-pizza-500/10 p-3.5 rounded-xl text-pizza-500">
                <ShoppingBag size={22} />
              </div>
              <div>
                <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Orders</p>
                <h4 className="text-xl font-black text-white mt-0.5">{summary.totalOrders}</h4>
              </div>
            </div>

            {/* Customers */}
            <div className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4">
              <div className="bg-pizza-500/10 p-3.5 rounded-xl text-pizza-500">
                <Users size={22} />
              </div>
              <div>
                <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Users</p>
                <h4 className="text-xl font-black text-white mt-0.5">{summary.totalCustomers}</h4>
              </div>
            </div>

            {/* Warning alerts */}
            <div className={`glass rounded-2xl p-5 border flex items-center gap-4 ${
              summary.lowStockCount > 0 ? 'border-red-500/20 bg-red-500/[0.02]' : 'border-white/5'
            }`}>
              <div className={`p-3.5 rounded-xl ${
                summary.lowStockCount > 0 ? 'bg-red-500/15 text-red-400' : 'bg-pizza-500/10 text-pizza-500'
              }`}>
                <AlertTriangle size={22} />
              </div>
              <div>
                <p className="text-[10px] text-dark-400 font-bold uppercase tracking-wider">Stock alerts</p>
                <h4 className="text-xl font-black text-white mt-0.5">{summary.lowStockCount} items</h4>
              </div>
            </div>
          </div>

          {/* SVG Graphs Area */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Sales Bar chart */}
            <div className="glass rounded-3xl p-6 border border-white/5">
              <h3 className="font-extrabold text-sm text-white mb-6">Daily Sales Timeline</h3>
              <div className="h-60 flex items-end justify-between gap-2.5 pt-6 relative border-b border-white/5 px-2">
                {charts.dailySales.map((item, i) => {
                  const maxRevenue = Math.max(...charts.dailySales.map((d) => d.revenue), 100);
                  const barHeight = (item.revenue / maxRevenue) * 80; // max 80% height

                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
                      {/* Tooltip */}
                      <span className="absolute -top-12 bg-pizza-500 text-dark-950 text-[10px] font-black px-2 py-1 rounded shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
                        ${item.revenue.toFixed(0)}
                      </span>
                      {/* Bar fill */}
                      <div
                        className="w-full bg-gradient-to-t from-pizza-700 to-pizza-400 rounded-t-lg transition-all duration-1000 group-hover:from-pizza-500 group-hover:to-pizza-300"
                        style={{ height: `${Math.max(barHeight, 10)}%` }}
                      ></div>
                      {/* X label */}
                      <span className="text-[10px] text-dark-400 font-semibold uppercase">{item.date}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Popular Ingredient shelf */}
            <div className="glass rounded-3xl p-6 border border-white/5">
              <h3 className="font-extrabold text-sm text-white mb-6">Popular Customizer Ingredients</h3>
              <div className="flex flex-col gap-4">
                {(charts.popularIngredients || []).map((item, i) => {
                  const maxCount = Math.max(...charts.popularIngredients.map((ing) => ing.count), 1);
                  const widthPercent = (item.count / maxCount) * 100;

                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-white">{item.name}</span>
                        <span className="text-pizza-400 font-bold">{item.count} orders</span>
                      </div>
                      <div className="w-full bg-dark-900 h-2.5 rounded-full overflow-hidden border border-white/5">
                        <div
                          className="bg-gradient-to-r from-pizza-600 to-pizza-400 h-full rounded-full transition-all duration-1000"
                          style={{ width: `${widthPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Low Stock alerting table */}
          {summary.lowStockCount > 0 && (
            <div className="glass rounded-3xl p-6 border border-red-500/20 bg-red-500/[0.01]">
              <h3 className="font-extrabold text-sm text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="text-red-400 animate-pulse" size={16} /> Inventory Depletion Warnings
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-dark-400">
                      <th className="py-2.5 font-semibold">Ingredient</th>
                      <th className="py-2.5 font-semibold">Category</th>
                      <th className="py-2.5 font-semibold text-right">Stock</th>
                      <th className="py-2.5 font-semibold text-right">Threshold</th>
                      <th className="py-2.5 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.lowStockItems.map((item) => (
                      <tr key={item.id} className="border-b border-white/3 text-dark-200">
                        <td className="py-3 font-bold text-white">{item.name}</td>
                        <td className="py-3 capitalize text-dark-400">{item.type}</td>
                        <td className="py-3 text-right text-red-400 font-black">{item.stock} units</td>
                        <td className="py-3 text-right">{item.threshold} units</td>
                        <td className="py-3 text-right">
                          <span className="bg-red-500/10 text-red-400 font-bold px-2 py-0.5 rounded text-[10px]">Restock Required</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Orders Tab */}
      {activeTab === 'orders' && (
        <div className="glass rounded-3xl p-6 border border-white/5">
          <h3 className="font-extrabold text-base text-white mb-6">Customer Orders Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-dark-400 font-bold">
                  <th className="py-3 pl-2">Order ID</th>
                  <th className="py-3">Customer</th>
                  <th className="py-3">Address</th>
                  <th className="py-3">Payment</th>
                  <th className="py-3 text-right">Amount</th>
                  <th className="py-3 text-right">Delivery Stage</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-dark-500">No customer orders recorded yet.</td>
                  </tr>
                ) : (
                  orders.map((o) => (
                    <tr key={o._id} className="border-b border-white/3 hover:bg-white/[0.01] transition-all">
                      <td className="py-4 pl-2 font-bold text-pizza-400">#{o._id.slice(-6).toUpperCase()}</td>
                      <td className="py-4">
                        <p className="font-semibold text-white">{o.customer?.name || 'Unknown'}</p>
                        <p className="text-[10px] text-dark-500">{o.customer?.email}</p>
                      </td>
                      <td className="py-4 text-dark-300 truncate max-w-[200px]" title={o.deliveryAddress}>
                        {o.deliveryAddress}
                      </td>
                      <td className="py-4">
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          o.paymentStatus === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="py-4 text-right font-black text-white">${o.finalAmount.toFixed(2)}</td>
                      <td className="py-4 text-right">
                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o._id, e.target.value)}
                          className="bg-dark-900 border border-white/5 px-2 py-1.5 rounded-lg text-[11px] text-white focus:outline-none focus:border-pizza-500 cursor-pointer"
                        >
                          <option value="Received">Received</option>
                          <option value="Preparing">Preparing</option>
                          <option value="Baking">Baking</option>
                          <option value="Packaging">Packaging</option>
                          <option value="Out for Delivery">Out for Delivery</option>
                          <option value="Delivered">Delivered</option>
                        </select>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Inventory Tab */}
      {activeTab === 'inventory' && (
        <div className="glass rounded-3xl p-6 border border-white/5">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-extrabold text-base text-white">Stock Control Ledger</h3>
            <button
              onClick={openAddModal}
              className="bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5"
            >
              <Plus size={14} /> Add Ingredient
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-dark-400 font-bold">
                  <th className="py-3 pl-2">Ingredient</th>
                  <th className="py-3">Type</th>
                  <th className="py-3 text-right">Price</th>
                  <th className="py-3 text-right">Stock</th>
                  <th className="py-3 text-right">Threshold</th>
                  <th className="py-3 text-right">Stock Alert</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const isLow = item.stock <= item.threshold;
                  return (
                    <tr
                      key={item._id}
                      className={`border-b border-white/3 hover:bg-white/[0.01] transition-all ${
                        isLow ? 'bg-red-500/[0.01]' : ''
                      }`}
                    >
                      <td className="py-4 pl-2 font-bold text-white">{item.name}</td>
                      <td className="py-4 capitalize text-dark-400">{item.type}</td>
                      <td className="py-4 text-right font-semibold text-pizza-400">${item.price.toFixed(2)}</td>
                      <td className="py-4 text-right font-bold text-white">{item.stock} units</td>
                      <td className="py-4 text-right text-dark-300">{item.threshold} units</td>
                      <td className="py-4 text-right">
                        {isLow ? (
                          <span className="bg-red-500/10 text-red-400 font-black px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            Low stock
                          </span>
                        ) : (
                          <span className="bg-green-500/10 text-green-400 font-semibold px-2 py-0.5 rounded text-[9px] uppercase tracking-wide">
                            Healthy
                          </span>
                        )}
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 hover:bg-white/5 text-dark-400 hover:text-white rounded"
                            title="Edit"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item._id)}
                            className="p-1.5 hover:bg-white/5 text-dark-400 hover:text-red-400 rounded"
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CRUD Inventory Modal Overlay */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <form
            onSubmit={handleInventorySubmit}
            className="w-full max-w-md glass border border-white/10 rounded-3xl p-6 shadow-2xl relative text-xs text-left"
          >
            <button
              type="button"
              onClick={() => setShowItemModal(false)}
              className="absolute right-4 top-4 text-dark-400 hover:text-white text-lg"
            >
              &times;
            </button>
            <h3 className="font-extrabold text-base text-white mb-6">
              {modalMode === 'add' ? 'Add Inventory Item' : 'Edit Inventory Item'}
            </h3>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-dark-300 block mb-1.5">Ingredient Name</label>
                <input
                  type="text"
                  required
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="e.g. Gorgonzola Cheese"
                  className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-xs text-white focus:outline-none focus:border-pizza-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-dark-300 block mb-1.5">Category Type</label>
                <select
                  value={itemType}
                  onChange={(e) => setItemType(e.target.value)}
                  className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-4 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="base">Pizza Base (Crust)</option>
                  <option value="sauce">Sauce</option>
                  <option value="cheese">Cheese</option>
                  <option value="veggie">Vegetable Topping</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-dark-300 block mb-1.5">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-3 text-xs text-white focus:outline-none focus:border-pizza-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark-300 block mb-1.5">Stock Count</label>
                  <input
                    type="number"
                    required
                    value={itemStock}
                    onChange={(e) => setItemStock(e.target.value)}
                    className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-3 text-xs text-white focus:outline-none focus:border-pizza-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-dark-300 block mb-1.5">Alert Limit</label>
                  <input
                    type="number"
                    required
                    value={itemThreshold}
                    onChange={(e) => setItemThreshold(e.target.value)}
                    className="w-full bg-dark-900 border border-white/5 rounded-xl py-3 px-3 text-xs text-white focus:outline-none focus:border-pizza-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full mt-4 bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black py-3.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                {actionLoading ? 'Processing...' : modalMode === 'add' ? 'Add Item' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
