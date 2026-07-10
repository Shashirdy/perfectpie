import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../store/cartSlice';
import { Search, SlidersHorizontal, Sparkles, Star, Pizza, ArrowRight, Check, Eye } from 'lucide-react';
import axios from 'axios';

export default function Home() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sortOption, setSortOption] = useState('rating');
  const [selectedProductReview, setSelectedProductReview] = useState(null);
  const [reviewsList, setReviewsList] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [addingToCartState, setAddingToCartState] = useState({});

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `http://localhost:5000/api/products?search=${searchTerm}&category=${categoryFilter}&sort=${sortOption}`;
      const res = await axios.get(url);
      
      if (res.data.success) {
        // If empty database, trigger seed automatically
        if (res.data.data.length === 0 && searchTerm === '' && categoryFilter === 'All') {
          console.log('Catalog empty. Bootstrapping presets...');
          const token = localStorage.getItem('token');
          await axios.post('http://localhost:5000/api/products/seed', {}, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          // Refetch
          const refetchRes = await axios.get(url);
          setProducts(refetchRes.data.data);
        } else {
          setProducts(res.data.data);
        }
      }
    } catch (err) {
      setError('Could not connect to database. Ensure server & mongodb are running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter, sortOption]);

  const handleAddToCart = (product) => {
    setAddingToCartState((prev) => ({ ...prev, [product._id]: true }));
    
    // Add default customized values for preset pizzas
    dispatch(
      addToCart({
        name: product.name,
        price: product.price,
        base: 'Hand Tossed',
        sauce: 'Tomato Basil',
        cheese: 'Mozzarella',
        veggies: product.name.includes('Veggie')
          ? ['Onion', 'Capsicum', 'Mushroom', 'Corn', 'Tomato']
          : product.name.includes('Chicken')
          ? ['Onion', 'Capsicum']
          : product.name.includes('Garden')
          ? ['Broccoli', 'Spinach', 'Tomato', 'Olive']
          : [],
        quantity: 1,
      })
    );

    setTimeout(() => {
      setAddingToCartState((prev) => ({ ...prev, [product._id]: false }));
    }, 1000);
  };

  const openReviewsModal = async (product) => {
    setSelectedProductReview(product);
    setNewComment('');
    setNewRating(5);
    try {
      const res = await axios.get(`http://localhost:5000/api/reviews/${encodeURIComponent(product.name)}`);
      if (res.data.success) {
        setReviewsList(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      alert('Please log in to submit a review.');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(
        'http://localhost:5000/api/reviews',
        {
          pizzaName: selectedProductReview.name,
          rating: newRating,
          comment: newComment,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.data.success) {
        setReviewsList((prev) => [res.data.data, ...prev]);
        setNewComment('');
        fetchProducts(); // Refresh average rating on catalog
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  // Map pizza name keywords to food photography images
  const getPizzaImage = (name) => {
    if (name.includes('Margherita')) return '/pizzas/margherita.png';
    if (name.includes('Veggie') || name.includes('Supreme')) return '/pizzas/veggie.png';
    if (name.includes('Chicken') || name.includes('BBQ')) return '/pizzas/chicken.png';
    if (name.includes('Cheese') || name.includes('Four')) return '/pizzas/cheese.png';
    if (name.includes('Garden') || name.includes('Green')) return '/pizzas/garden.png';
    if (name.includes('Spicy') || name.includes('Jalape') || name.includes('Fire')) return '/pizzas/spicy.png';
    // Rotate through available images for any other pizza
    const all = ['/pizzas/margherita.png', '/pizzas/veggie.png', '/pizzas/chicken.png', '/pizzas/cheese.png'];
    let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
    return all[h % all.length];
  };

  return (
    <div className="px-6 md:px-12 py-10 max-w-7xl mx-auto flex flex-col gap-12">
      {/* 1. Hero Promo Section */}
      <section className="glass rounded-3xl p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-pizza-500/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="flex-1 flex flex-col gap-5 text-center md:text-left">
          <div className="inline-flex self-center md:self-start bg-pizza-500/20 text-pizza-400 text-xs px-3.5 py-1 rounded-full font-bold uppercase tracking-wider items-center gap-1.5 border border-pizza-500/25">
            <Sparkles size={12} className="animate-spin-slow" /> Premium Pizza Crafter
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight text-white">
            Build the Pizza of <br className="hidden md:inline" />
            Your Dreams in <span className="text-pizza-500">Real-Time 3D</span>
          </h1>
          <p className="text-dark-300 text-sm max-w-lg leading-relaxed">
            Unleash your culinary creativity. Select your favorite crust base, premium sauce bases, melted cheeses, and pile on fresh toppings. Watch it shape dynamically in 3D, check out with ease, and track your baking live.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-2">
            <Link
              to="/customizer"
              className="bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black text-sm px-6 py-4 rounded-xl shadow-lg shadow-pizza-500/10 flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-[1.02]"
            >
              Start 3D Pizza Builder <ArrowRight size={16} className="group-hover:translate-x-1.5 transition-transform" />
            </Link>
            <a
              href="#catalog"
              className="glass hover:bg-white/5 border border-white/10 text-white font-semibold text-sm px-6 py-4 rounded-xl flex items-center justify-center transition-all"
            >
              Browse Pizza Presets
            </a>
          </div>
        </div>

        {/* Hero Pizza Photo */}
        <div className="flex-1 flex items-center justify-center relative w-full max-w-sm">
          {/* Outer glow ring */}
          <div className="w-64 h-64 md:w-80 md:h-80 rounded-full bg-gradient-to-tr from-pizza-500/40 to-amber-500/20 p-[3px] animate-spin-slow shadow-2xl relative">
            <div className="w-full h-full rounded-full overflow-hidden border-2 border-pizza-500/30 shadow-inner">
              <img
                src="/pizzas/margherita.png"
                alt="PerfectPie signature pizza"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. Catalog Section */}
      <section id="catalog" className="flex flex-col gap-6 scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">PerfectPie Pizza Catalog</h2>
            <p className="text-xs text-dark-400 mt-1">Select from our signature handcrafted pizzas, prepared fresh on demand</p>
          </div>

          {/* Search, Filter, Sort Actions */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dark-500" size={16} />
              <input
                type="text"
                placeholder="Search pizzas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-dark-900 border border-white/5 pl-10 pr-4 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-pizza-500 w-52"
              />
            </div>

            {/* Category Selectors */}
            <div className="flex bg-dark-900 p-1 rounded-xl border border-white/5 text-xs font-semibold">
              {['All', 'Veg', 'Non-Veg'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    categoryFilter === cat ? 'bg-pizza-500 text-dark-950 font-bold' : 'text-dark-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="bg-dark-900 border border-white/5 px-3 py-2.5 rounded-xl text-xs text-white focus:outline-none focus:border-pizza-500 cursor-pointer appearance-none pr-8"
              >
                <option value="rating">Sort by Rating</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
              <SlidersHorizontal className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-400 pointer-events-none" size={12} />
            </div>
          </div>
        </div>

        {/* Error / Loading States */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass h-96 rounded-3xl animate-pulse"></div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-16 glass rounded-3xl border border-red-500/10">
            <Pizza size={48} className="mx-auto text-dark-600 mb-3" />
            <p className="text-sm text-dark-300 font-bold">{error}</p>
            <p className="text-xs text-dark-500 mt-1">Make sure you ran the backend seed endpoint or that the server is online.</p>
            <button onClick={fetchProducts} className="mt-4 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs text-white border border-white/10 transition-all">
              Try Reconnecting
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 glass rounded-3xl">
            <Search size={40} className="mx-auto text-dark-600 mb-3" />
            <p className="text-sm text-dark-300 font-bold">No pizzas match your query</p>
            <p className="text-xs text-dark-500 mt-1">Try resetting search filters or keywords</p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product._id}
                className="glass rounded-3xl p-5 border border-white/5 shadow-xl hover:border-white/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Pizza Photo */}
                  <div className="h-48 w-full rounded-2xl relative overflow-hidden group mb-4 bg-dark-900">
                    <img
                      src={getPizzaImage(product.name)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    {/* Fallback gradient */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-pizza-600 to-amber-500 items-center justify-center hidden">
                      <Pizza size={72} className="text-white fill-white/10" />
                    </div>
                    {/* Overlay gradient for readability of tags */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                    {/* Category tag */}
                    <span className={`absolute top-3 left-3 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full backdrop-blur-sm ${
                      product.category === 'Veg'
                        ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                        : 'bg-red-500/30 text-red-300 border border-red-500/40'
                    }`}>
                      {product.category}
                    </span>
                    {/* Rating tag */}
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-dark-950/80 text-pizza-400 px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md backdrop-blur-sm">
                      <Star size={10} className="fill-pizza-500 text-pizza-500" />
                      {product.rating}
                    </span>
                  </div>

                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-extrabold text-base text-white">{product.name}</h3>
                    <span className="text-base font-black text-pizza-400">${product.price.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-dark-300 leading-relaxed min-h-[48px] mb-4">{product.description}</p>
                </div>

                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => openReviewsModal(product)}
                    className="glass hover:bg-white/5 border border-white/5 text-dark-300 hover:text-white px-3 py-3 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
                    title="Read reviews"
                  >
                    <Eye size={14} /> Reviews
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={addingToCartState[product._id]}
                    className="flex-1 bg-pizza-500 hover:bg-pizza-600 disabled:bg-green-500 disabled:text-dark-950 text-dark-950 font-black text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-pizza-500/5 active:scale-[0.98]"
                  >
                    {addingToCartState[product._id] ? (
                      <>
                        <Check size={14} className="stroke-[3]" /> Added to Cart
                      </>
                    ) : (
                      'Add to Cart'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Review Modal Dialog */}
      {selectedProductReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg glass border border-white/10 rounded-3xl p-6 shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setSelectedProductReview(null)}
              className="absolute right-4 top-4 text-dark-400 hover:text-white text-xl"
            >
              &times;
            </button>
            <h3 className="text-lg font-black text-white mb-1">Reviews for {selectedProductReview.name}</h3>
            <div className="flex items-center gap-1 text-xs text-pizza-400 mb-4 font-semibold">
              <Star size={14} className="fill-pizza-500 text-pizza-500" />
              <span>{selectedProductReview.rating} average rating</span>
            </div>

            {/* Past Reviews List */}
            <div className="max-h-56 overflow-y-auto mb-6 flex flex-col gap-3 pr-2">
              {reviewsList.length === 0 ? (
                <p className="text-xs text-dark-400 py-4 text-center">No reviews posted yet. Be the first!</p>
              ) : (
                reviewsList.map((rev) => (
                  <div key={rev._id} className="bg-white/3 border border-white/5 p-3 rounded-2xl text-xs">
                    <div className="flex justify-between items-center mb-1">
                      <strong className="text-white">{rev.user?.name || 'Anonymous'}</strong>
                      <span className="text-pizza-400 flex items-center gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} size={10} className="fill-pizza-500 text-pizza-500" />
                        ))}
                      </span>
                    </div>
                    <p className="text-dark-300">{rev.comment}</p>
                    <span className="text-[9px] text-dark-500 mt-1 block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>

            {/* Write Review Form */}
            {isAuthenticated ? (
              <form onSubmit={submitReview} className="border-t border-white/5 pt-4">
                <h4 className="text-xs font-bold text-white mb-3">Submit Your Review</h4>
                <div className="flex gap-4 items-center mb-3">
                  <span className="text-xs text-dark-300">Rating:</span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setNewRating(val)}
                        className="text-pizza-500 hover:scale-110 transition-transform"
                      >
                        <Star size={18} className={val <= newRating ? 'fill-pizza-500' : 'text-dark-700'} />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <textarea
                    rows="3"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write your review comments here..."
                    className="w-full bg-dark-900 border border-white/5 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pizza-500 placeholder:text-dark-600"
                  ></textarea>
                  <button
                    type="submit"
                    className="w-full bg-pizza-500 hover:bg-pizza-600 text-dark-950 font-black text-xs py-2.5 rounded-xl transition-all"
                  >
                    Post Review
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-white/5 pt-4 text-center">
                <p className="text-xs text-dark-400">
                  Please{' '}
                  <Link to="/login" className="text-pizza-400 hover:text-pizza-300 font-bold">
                    login
                  </Link>{' '}
                  to write a review for this pizza preset.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
