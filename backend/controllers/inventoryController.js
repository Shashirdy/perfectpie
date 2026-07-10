const Inventory = require('../models/Inventory');

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Public (for customizer options) / Private
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find({});
    res.status(200).json({ success: true, count: inventory.length, data: inventory });
  } catch (error) {
    console.error('Get inventory error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to retrieve inventory.' });
  }
};

// @desc    Add a new inventory item
// @route   POST /api/inventory
// @access  Private/Admin
exports.addInventoryItem = async (req, res) => {
  try {
    const { name, type, price, stock, threshold, image } = req.body;

    const exists = await Inventory.findOne({ name });
    if (exists) {
      return res.status(400).json({ success: false, message: 'An inventory item with this name already exists' });
    }

    const item = await Inventory.create({
      name,
      type,
      price,
      stock,
      threshold,
      image: image || `/images/${type}s/${name.toLowerCase().replace(/\s+/g, '_')}.png`,
    });

    res.status(201).json({ success: true, message: 'Inventory item added successfully', data: item });
  } catch (error) {
    console.error('Add inventory error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to add inventory item.' });
  }
};

// @desc    Update an inventory item
// @route   PUT /api/inventory/:id
// @access  Private/Admin
exports.updateInventoryItem = async (req, res) => {
  try {
    const { name, type, price, stock, threshold, available, image } = req.body;
    let item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    item.name = name !== undefined ? name : item.name;
    item.type = type !== undefined ? type : item.type;
    item.price = price !== undefined ? price : item.price;
    item.stock = stock !== undefined ? stock : item.stock;
    item.threshold = threshold !== undefined ? threshold : item.threshold;
    item.available = available !== undefined ? available : item.available;
    item.image = image !== undefined ? image : item.image;

    await item.save();

    res.status(200).json({ success: true, message: 'Inventory item updated successfully', data: item });
  } catch (error) {
    console.error('Update inventory error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to update inventory item.' });
  }
};

// @desc    Update stock of an item directly
// @route   PATCH /api/inventory/:id/stock
// @access  Private/Admin
exports.updateStock = async (req, res) => {
  try {
    const { stock } = req.body;
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    item.stock = stock;
    await item.save();

    res.status(200).json({ success: true, message: 'Stock updated successfully', data: item });
  } catch (error) {
    console.error('Update stock error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to update stock.' });
  }
};

// @desc    Delete an inventory item
// @route   DELETE /api/inventory/:id
// @access  Private/Admin
exports.deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory item not found' });
    }

    await item.deleteOne();

    res.status(200).json({ success: true, message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to delete inventory item.' });
  }
};

// @desc    Seed initial inventory
// @route   POST /api/inventory/seed
// @access  Private/Admin
exports.seedInventory = async (req, res) => {
  try {
    const count = await Inventory.countDocuments();
    if (count > 0) {
      return res.status(400).json({ success: false, message: 'Inventory is already seeded.' });
    }

    const defaultItems = [
      // Bases
      { name: 'Thin Crust', type: 'base', price: 5.99, stock: 50, threshold: 20 },
      { name: 'Hand Tossed', type: 'base', price: 6.99, stock: 60, threshold: 20 },
      { name: 'Cheese Burst', type: 'base', price: 8.99, stock: 40, threshold: 20 },
      { name: 'Stuffed Crust', type: 'base', price: 7.99, stock: 35, threshold: 20 },
      { name: 'Whole Wheat', type: 'base', price: 6.99, stock: 30, threshold: 20 },

      // Sauces
      { name: 'Tomato Basil', type: 'sauce', price: 1.50, stock: 80, threshold: 25 },
      { name: 'BBQ Sauce', type: 'sauce', price: 1.75, stock: 70, threshold: 20 },
      { name: 'Alfredo', type: 'sauce', price: 2.00, stock: 55, threshold: 20 },
      { name: 'Garlic Parmesan', type: 'sauce', price: 2.00, stock: 60, threshold: 20 },
      { name: 'Spicy Arrabbiata', type: 'sauce', price: 1.75, stock: 65, threshold: 20 },

      // Cheeses
      { name: 'Mozzarella', type: 'cheese', price: 2.50, stock: 90, threshold: 30 },
      { name: 'Cheddar', type: 'cheese', price: 2.75, stock: 70, threshold: 20 },
      { name: 'Parmesan', type: 'cheese', price: 3.00, stock: 60, threshold: 20 },
      { name: 'Provolone', type: 'cheese', price: 2.75, stock: 50, threshold: 20 },
      { name: 'Vegan Cheese', type: 'cheese', price: 3.50, stock: 40, threshold: 20 },

      // Veggies
      { name: 'Onion', type: 'veggie', price: 0.75, stock: 120, threshold: 30 },
      { name: 'Capsicum', type: 'veggie', price: 0.75, stock: 110, threshold: 30 },
      { name: 'Mushroom', type: 'veggie', price: 1.00, stock: 80, threshold: 25 },
      { name: 'Corn', type: 'veggie', price: 0.75, stock: 100, threshold: 20 },
      { name: 'Tomato', type: 'veggie', price: 0.75, stock: 120, threshold: 30 },
      { name: 'Olive', type: 'veggie', price: 1.00, stock: 90, threshold: 20 },
      { name: 'Jalapeño', type: 'veggie', price: 0.90, stock: 85, threshold: 20 },
      { name: 'Broccoli', type: 'veggie', price: 1.10, stock: 70, threshold: 20 },
      { name: 'Spinach', type: 'veggie', price: 0.80, stock: 65, threshold: 20 },
      { name: 'Paneer', type: 'veggie', price: 1.50, stock: 50, threshold: 20 },
    ];

    const seeded = await Inventory.insertMany(
      defaultItems.map((item) => ({
        ...item,
        image: `/images/${item.type}s/${item.name.toLowerCase().replace(/\s+/g, '_')}.png`,
      }))
    );

    res.status(201).json({ success: true, count: seeded.length, message: 'Default inventory seeded successfully' });
  } catch (error) {
    console.error('Seed inventory error:', error.message);
    res.status(500).json({ success: false, message: 'Server error. Failed to seed inventory.' });
  }
};
