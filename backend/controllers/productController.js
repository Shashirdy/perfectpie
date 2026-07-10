const Product = require('../models/Product');

// @desc    Get all catalog products
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
  try {
    const { search, category, sort } = req.query;
    let query = { available: true };

    // Search filter
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    let apiQuery = Product.find(query);

    // Sorting
    if (sort) {
      if (sort === 'price-low') {
        apiQuery = apiQuery.sort({ price: 1 });
      } else if (sort === 'price-high') {
        apiQuery = apiQuery.sort({ price: -1 });
      } else if (sort === 'rating') {
        apiQuery = apiQuery.sort({ rating: -1 });
      }
    } else {
      apiQuery = apiQuery.sort({ createdAt: -1 });
    }

    const products = await apiQuery;
    res.status(200).json({ success: true, count: products.length, data: products });
  } catch (error) {
    console.error('Get products error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve products.' });
  }
};

// @desc    Get single catalog product
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Pizza preset not found' });
    }
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    console.error('Get product by ID error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve product.' });
  }
};

// @desc    Create new catalog product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, image, available } = req.body;

    const exists = await Product.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'A pizza with this name already exists' });
    }

    const product = await Product.create({
      name,
      description,
      price,
      category,
      image: image || `/images/pizzas/${name.toLowerCase().replace(/\s+/g, '_')}.png`,
      available,
    });

    res.status(201).json({ success: true, message: 'Pizza preset created successfully', data: product });
  } catch (error) {
    console.error('Create product error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to create preset.' });
  }
};

// @desc    Seed default products
// @route   POST /api/products/seed
// @access  Private/Admin
exports.seedProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments({});
    if (count > 0) {
      return res.status(400).json({ success: false, message: 'Catalog products already seeded' });
    }

    const defaultProducts = [
      {
        name: 'Classic Margherita',
        description: 'Classic delight with 100% real Mozzarella cheese on a Hand Tossed base with Tomato Basil sauce.',
        price: 12.99,
        category: 'Veg',
        rating: 4.6,
      },
      {
        name: 'Veggie Supreme',
        description: 'Loaded with Capsicum, Onion, Sweet Corn, Mushrooms, and Tomatoes on a Thin Crust base.',
        price: 15.99,
        category: 'Veg',
        rating: 4.8,
      },
      {
        name: 'BBQ Chicken Feast',
        description: 'Smoked chicken pieces, BBQ Sauce, Onion, Capsicum, and Cheddar cheese on a Stuffed Crust base.',
        price: 18.99,
        category: 'Non-Veg',
        rating: 4.7,
      },
      {
        name: 'Double Cheese Burst',
        description: 'Mozzarella, Cheddar, and Provolone on our famous liquid Cheese Burst base.',
        price: 16.99,
        category: 'Veg',
        rating: 4.9,
      },
      {
        name: 'Garden Special',
        description: 'Fresh Broccoli, Spinach, Tomatoes, Olives, and Garlic Parmesan sauce on a Whole Wheat base.',
        price: 14.99,
        category: 'Veg',
        rating: 4.5,
      },
    ];

    const seeded = await Product.insertMany(
      defaultProducts.map((p) => ({
        ...p,
        image: `/images/pizzas/${p.name.toLowerCase().replace(/\s+/g, '_')}.png`,
      }))
    );

    res.status(201).json({ success: true, count: seeded.length, message: 'Catalog products seeded successfully' });
  } catch (error) {
    console.error('Seed products error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to seed products.' });
  }
};
