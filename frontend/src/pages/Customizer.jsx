import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { fetchInventoryStart, fetchInventorySuccess, fetchInventoryFailure } from '../store/inventorySlice';
import PizzaBuilder3D from '../components/PizzaBuilder3D';
import { ChevronRight, ChevronLeft, ShoppingBag, RotateCcw, CheckCircle } from 'lucide-react';
import axios from 'axios';

export default function Customizer() {
  const navigate  = useNavigate();
  const dispatch  = useDispatch();

  const [selections, setSelections] = useState({
    base:   'Hand Tossed',
    sauce:  'Tomato Basil',
    cheese: 'Mozzarella',
    veggies: [],
  });

  const [activeStep,    setActiveStep]    = useState(1);
  const [loading,       setLoading]       = useState(true);
  const [apiItems,      setApiItems]      = useState([]);
  const [error,         setError]         = useState('');
  const [successToast,  setSuccessToast]  = useState(false);

  /* ── Inventory fetch ─────────────────────────────────────────── */
  const loadInventory = async () => {
    setLoading(true);
    dispatch(fetchInventoryStart());
    try {
      const res = await axios.get('http://localhost:5000/api/inventory');
      if (res.data.success) {
        let items = res.data.data;
        if (items.length === 0) {
          const token = localStorage.getItem('token');
          await axios.post('http://localhost:5000/api/inventory/seed', {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          const reRes = await axios.get('http://localhost:5000/api/inventory');
          items = reRes.data.data;
        }
        setApiItems(items);
        dispatch(fetchInventorySuccess(items));
      }
    } catch (err) {
      setError('Could not connect to server to fetch ingredients.');
      dispatch(fetchInventoryFailure(err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInventory(); }, []);

  /* ── Derived data ───────────────────────────────────────────── */
  const bases   = apiItems.filter((i) => i.type === 'base');
  const sauces  = apiItems.filter((i) => i.type === 'sauce');
  const cheeses = apiItems.filter((i) => i.type === 'cheese');
  const veggies = apiItems.filter((i) => i.type === 'veggie');

  const backupBases   = [
    { name: 'Thin Crust',    price: 5.99, stock: 50 },
    { name: 'Hand Tossed',   price: 6.99, stock: 60 },
    { name: 'Cheese Burst',  price: 8.99, stock: 40 },
    { name: 'Stuffed Crust', price: 7.99, stock: 35 },
    { name: 'Whole Wheat',   price: 6.99, stock: 30 },
  ];
  const backupSauces  = [
    { name: 'Tomato Basil',     price: 1.50, stock: 80 },
    { name: 'BBQ Sauce',        price: 1.75, stock: 70 },
    { name: 'Alfredo',          price: 2.00, stock: 55 },
    { name: 'Garlic Parmesan',  price: 2.00, stock: 60 },
    { name: 'Spicy Arrabbiata', price: 1.75, stock: 65 },
  ];
  const backupCheeses = [
    { name: 'Mozzarella',   price: 2.50, stock: 90 },
    { name: 'Cheddar',      price: 2.75, stock: 70 },
    { name: 'Parmesan',     price: 3.00, stock: 60 },
    { name: 'Provolone',    price: 2.75, stock: 50 },
    { name: 'Vegan Cheese', price: 3.50, stock: 40 },
  ];
  const backupVeggies = [
    { name: 'Onion',     price: 0.75, stock: 120 },
    { name: 'Capsicum',  price: 0.75, stock: 110 },
    { name: 'Mushroom',  price: 1.00, stock: 80  },
    { name: 'Corn',      price: 0.75, stock: 100 },
    { name: 'Tomato',    price: 0.75, stock: 120 },
    { name: 'Olive',     price: 1.00, stock: 90  },
    { name: 'Jalapeño',  price: 0.90, stock: 85  },
    { name: 'Broccoli',  price: 1.10, stock: 70  },
    { name: 'Spinach',   price: 0.80, stock: 65  },
    { name: 'Paneer',    price: 1.50, stock: 50  },
  ];

  const activeBases   = bases.length   ? bases   : backupBases;
  const activeSauces  = sauces.length  ? sauces  : backupSauces;
  const activeCheeses = cheeses.length ? cheeses : backupCheeses;
  const activeVeggies = veggies.length ? veggies : backupVeggies;

  /* ── Price ──────────────────────────────────────────────────── */
  const totalPrice = (() => {
    let p = 0;
    const b = activeBases.find((x) => x.name === selections.base);
    const s = activeSauces.find((x) => x.name === selections.sauce);
    const c = activeCheeses.find((x) => x.name === selections.cheese);
    if (b) p += b.price;
    if (s) p += s.price;
    if (c) p += c.price;
    selections.veggies.forEach((vName) => {
      const v = activeVeggies.find((x) => x.name === vName);
      if (v) p += v.price;
    });
    return parseFloat(p.toFixed(2));
  })();

  /* ── Handlers ───────────────────────────────────────────────── */
  const handleAddToCart = () => {
    dispatch(addToCart({
      name: 'Custom Pizza',
      price: totalPrice,
      base: selections.base,
      sauce: selections.sauce,
      cheese: selections.cheese,
      veggies: selections.veggies,
      quantity: 1,
    }));
    setSuccessToast(true);
    setTimeout(() => { setSuccessToast(false); navigate('/cart'); }, 1500);
  };

  const resetBuilder = () => {
    setSelections({ base: 'Hand Tossed', sauce: 'Tomato Basil', cheese: 'Mozzarella', veggies: [] });
    setActiveStep(1);
  };

  const stepsList = ['Select Crust', 'Select Sauce', 'Select Cheese', 'Choose Veggies'];

  /* ── Shared option card ─────────────────────────────────────── */
  const OptionCard = ({ item, selected, onSelect }) => (
    <button
      onClick={() => onSelect(item.name)}
      disabled={item.stock === 0}
      className={`p-4 rounded-2xl text-left border transition-all flex justify-between items-center ${
        item.stock === 0
          ? 'opacity-40 cursor-not-allowed border-white/5'
          : selected
          ? 'bg-pizza-500/10 border-pizza-500 text-white'
          : 'bg-dark-900/60 border-white/5 text-dark-200 hover:border-white/10 hover:bg-white/[0.03]'
      }`}
    >
      <div>
        <p className="text-sm font-bold">{item.name}</p>
        <p className="text-[10px] text-dark-400 mt-0.5">
          {item.stock <= 20
            ? <span className="text-amber-500 font-semibold">Only {item.stock} left</span>
            : 'In stock'}
        </p>
      </div>
      <span className="text-sm font-extrabold text-pizza-400">+${item.price.toFixed(2)}</span>
    </button>
  );

  /* ── Render ─────────────────────────────────────────────────── */
  return (
    <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-white">Pizza Customizer</h1>
          <p className="text-xs text-dark-400 mt-1">Build your perfect pizza — watch it come to life in 3D</p>
        </div>
        <button
          onClick={resetBuilder}
          className="glass hover:bg-white/5 border border-white/5 text-xs text-dark-300 hover:text-white px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 font-semibold"
        >
          <RotateCcw size={13} /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left — 3D Preview */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <PizzaBuilder3D selections={selections} autoRotate={activeStep === 4} />

          {/* Ingredient summary chips */}
          <div className="glass rounded-2xl p-4 border border-white/5">
            <p className="text-[10px] text-dark-400 uppercase tracking-wider font-bold mb-3">Your Pizza</p>
            <div className="flex flex-wrap gap-2">
              <span className="bg-pizza-500/10 text-pizza-400 border border-pizza-500/20 text-xs px-3 py-1 rounded-full">🍞 {selections.base}</span>
              <span className="bg-pizza-500/10 text-pizza-400 border border-pizza-500/20 text-xs px-3 py-1 rounded-full">🥫 {selections.sauce}</span>
              <span className="bg-pizza-500/10 text-pizza-400 border border-pizza-500/20 text-xs px-3 py-1 rounded-full">🧀 {selections.cheese}</span>
              {selections.veggies.length > 0
                ? selections.veggies.map((v) => (
                    <span key={v} className="bg-green-500/10 text-green-400 border border-green-500/20 text-xs px-3 py-1 rounded-full">🌱 {v}</span>
                  ))
                : <span className="text-dark-500 text-xs italic">No veggies yet</span>}
            </div>
          </div>
        </div>

        {/* Right — Wizard */}
        <div className="lg:col-span-7 flex flex-col gap-5">

          {/* Step progress */}
          <div className="glass rounded-2xl p-4 border border-white/5">
            <div className="flex justify-between items-center text-xs mb-3 font-semibold text-dark-300">
              <span>Step {activeStep} of 4</span>
              <span className="text-pizza-400">{stepsList[activeStep - 1]}</span>
            </div>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((n) => (
                <div
                  key={n}
                  onClick={() => setActiveStep(n)}
                  className={`flex-1 h-2 rounded-full cursor-pointer transition-all duration-300 ${
                    activeStep >= n ? 'bg-pizza-500' : 'bg-dark-800 hover:bg-dark-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step panel */}
          <div className="glass rounded-3xl p-6 border border-white/5 min-h-[300px] flex flex-col justify-between">

            {/* Step 1: Crust */}
            {activeStep === 1 && (
              <div>
                <h3 className="font-extrabold text-lg text-white mb-1">Select Pizza Crust</h3>
                <p className="text-xs text-dark-400 mb-5">Choose the thickness and style of your base</p>
                <div className="flex flex-col gap-3">
                  {activeBases.map((item) => (
                    <OptionCard key={item.name} item={item} selected={selections.base === item.name} onSelect={(n) => setSelections((p) => ({ ...p, base: n }))} />
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Sauce */}
            {activeStep === 2 && (
              <div>
                <h3 className="font-extrabold text-lg text-white mb-1">Select Sauce</h3>
                <p className="text-xs text-dark-400 mb-5">Choose one sauce to spread across your crust</p>
                <div className="flex flex-col gap-3">
                  {activeSauces.map((item) => (
                    <OptionCard key={item.name} item={item} selected={selections.sauce === item.name} onSelect={(n) => setSelections((p) => ({ ...p, sauce: n }))} />
                  ))}
                </div>
              </div>
            )}

            {/* Step 3: Cheese */}
            {activeStep === 3 && (
              <div>
                <h3 className="font-extrabold text-lg text-white mb-1">Select Cheese</h3>
                <p className="text-xs text-dark-400 mb-5">Pick a premium cheese to melt over your sauce</p>
                <div className="flex flex-col gap-3">
                  {activeCheeses.map((item) => (
                    <OptionCard key={item.name} item={item} selected={selections.cheese === item.name} onSelect={(n) => setSelections((p) => ({ ...p, cheese: n }))} />
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Veggies */}
            {activeStep === 4 && (
              <div>
                <h3 className="font-extrabold text-lg text-white mb-1">Add Vegetables</h3>
                <p className="text-xs text-dark-400 mb-5">Pick as many toppings as you like</p>
                <div className="grid grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
                  {activeVeggies.map((item) => {
                    const isChecked = selections.veggies.includes(item.name);
                    return (
                      <button
                        key={item.name}
                        onClick={() =>
                          setSelections((p) => ({
                            ...p,
                            veggies: isChecked
                              ? p.veggies.filter((v) => v !== item.name)
                              : [...p.veggies, item.name],
                          }))
                        }
                        disabled={item.stock === 0}
                        className={`p-3.5 rounded-2xl text-left border transition-all flex justify-between items-center ${
                          item.stock === 0
                            ? 'opacity-40 cursor-not-allowed border-white/5'
                            : isChecked
                            ? 'bg-pizza-500/10 border-pizza-500 text-white'
                            : 'bg-dark-900/60 border-white/5 text-dark-200 hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] ${
                            isChecked ? 'border-pizza-500 bg-pizza-500 text-dark-950 font-black' : 'border-dark-600 bg-dark-950'
                          }`}>
                            {isChecked && '✓'}
                          </div>
                          <div>
                            <p className="text-xs font-bold">{item.name}</p>
                            <p className="text-[9px] text-dark-400">Stock: {item.stock}</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-pizza-400">+${item.price.toFixed(2)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between items-center mt-7 border-t border-white/5 pt-5">
              <button
                onClick={() => activeStep > 1 && setActiveStep(activeStep - 1)}
                disabled={activeStep === 1}
                className="glass hover:bg-white/5 disabled:opacity-30 border border-white/5 text-xs text-white px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all font-semibold"
              >
                <ChevronLeft size={15} /> Back
              </button>

              {activeStep < 4 ? (
                <button
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-white px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all font-semibold"
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black text-xs px-6 py-3 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-pizza-500/20 active:scale-95"
                >
                  <ShoppingBag size={14} /> Add to Cart
                </button>
              )}
            </div>
          </div>

          {/* Price card */}
          <div className="glass rounded-2xl p-5 border border-pizza-500/20 bg-pizza-500/[0.02] flex items-center justify-between">
            <div>
              <p className="text-[10px] text-pizza-400 font-bold uppercase tracking-wider">Total Price</p>
              <h4 className="text-2xl font-black text-white mt-0.5">${totalPrice.toFixed(2)}</h4>
            </div>
            <div className="text-right text-[10px] text-dark-400">
              <p>Fresh, made to order</p>
              <p className="text-pizza-400 mt-0.5">Baked fresh in stone ovens</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success toast */}
      {successToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 glass border border-green-500/60 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3">
          <CheckCircle size={17} className="text-green-400" />
          <span className="text-xs font-semibold">Custom Pizza added to cart! Redirecting…</span>
        </div>
      )}
    </div>
  );
}
