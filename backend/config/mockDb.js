const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const mockFilePath = path.join(__dirname, '../db_mock.json');

// In-memory data store
let data = {
  users: [],
  inventories: [],
  orders: [],
  coupons: [],
  notifications: [],
  products: [],
  reviews: []
};

// Load existing mock data if it exists
if (fs.existsSync(mockFilePath)) {
  try {
    data = JSON.parse(fs.readFileSync(mockFilePath, 'utf8'));
    console.log('[Mock DB] Loaded existing mock database from:', mockFilePath);
  } catch (err) {
    console.error('[Mock DB] Failed to parse mock DB JSON, initializing empty:', err.message);
  }
} else {
  console.log('[Mock DB] No mock database found, initializing with default products/coupons...');
  data.products = [
    {
      _id: 'prod11111111111111111111',
      name: 'Margherita',
      description: 'Classic delight with 100% real mozzarella cheese and tomato basil sauce.',
      price: 9.99,
      image: '/images/products/margherita.png',
      category: 'Veg',
      rating: 4.8,
      available: true
    },
    {
      _id: 'prod22222222222222222222',
      name: 'Double Cheese Margherita',
      description: 'The classic Margherita pizza loaded with extra mozzarella cheese.',
      price: 12.99,
      image: '/images/products/double_cheese.png',
      category: 'Veg',
      rating: 4.7,
      available: true
    },
    {
      _id: 'prod33333333333333333333',
      name: 'Farmhouse',
      description: 'Delightful combination of onion, capsicum, mushroom, and tomato.',
      price: 14.99,
      image: '/images/products/farmhouse.png',
      category: 'Veg',
      rating: 4.9,
      available: true
    },
    {
      _id: 'prod44444444444444444444',
      name: 'Chicken Golden Delight',
      description: 'Double portion of chicken golden delight with capsicum and corn.',
      price: 16.99,
      image: '/images/products/chicken_delight.png',
      category: 'Non-Veg',
      rating: 4.6,
      available: true
    }
  ];
  data.coupons = [
    {
      _id: 'coup11111111111111111111',
      code: 'PIZZA20',
      discountType: 'percentage',
      discountValue: 20,
      minOrderValue: 15.00,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    },
    {
      _id: 'coup22222222222222222222',
      code: 'FLAT10',
      discountType: 'flat',
      discountValue: 10,
      minOrderValue: 25.00,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true
    }
  ];
  
  try {
    fs.writeFileSync(mockFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Mock DB] Failed to save mock DB JSON:', err.message);
  }
}

// Save mock data helper
const saveMockData = () => {
  try {
    fs.writeFileSync(mockFilePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('[Mock DB] Failed to save mock DB JSON:', err.message);
  }
};

// Map Mongoose model names to collections
const getCollection = (modelName) => {
  const name = modelName.toLowerCase();
  if (name === 'user') return 'users';
  if (name === 'inventory') return 'inventories';
  if (name === 'order') return 'orders';
  if (name === 'coupon') return 'coupons';
  if (name === 'notification') return 'notifications';
  if (name === 'product') return 'products';
  if (name === 'review') return 'reviews';
  return name + 's';
};

// Generate random 24-char hex ID matching MongoDB ObjectIds
const generateId = () => {
  return require('crypto').randomBytes(12).toString('hex');
};

// Query evaluator matching MongoDB query operations
const matchesQuery = (item, query) => {
  if (!query || Object.keys(query).length === 0) return true;
  
  for (const key of Object.keys(query)) {
    const val = query[key];
    
    // Support $expr for low stock: { $expr: { $lte: ['$stock', '$threshold'] } }
    if (key === '$expr') {
      if (val && val.$lte) {
        const [fieldA, fieldB] = val.$lte;
        const keyA = fieldA.replace('$', '');
        const keyB = fieldB.replace('$', '');
        if (Number(item[keyA]) > Number(item[keyB])) {
          return false;
        }
        continue;
      }
    }
    
    // Support $gt inside fields (e.g. resetPasswordExpire: { $gt: Date.now() })
    if (val && typeof val === 'object' && ('$gt' in val || '$lt' in val || '$gte' in val || '$lte' in val || '$ne' in val)) {
      const itemVal = item[key];
      if ('$gt' in val) {
        const target = val.$gt instanceof Date ? val.$gt.getTime() : new Date(val.$gt).getTime();
        const current = itemVal instanceof Date ? itemVal.getTime() : new Date(itemVal).getTime();
        if (!(current > target)) return false;
      }
      if ('$lt' in val) {
        const target = val.$lt instanceof Date ? val.$lt.getTime() : new Date(val.$lt).getTime();
        const current = itemVal instanceof Date ? itemVal.getTime() : new Date(itemVal).getTime();
        if (!(current < target)) return false;
      }
      continue;
    }
    
    // Support $regex for text search (e.g. name: { $regex: 'pizza', $options: 'i' })
    if (val && typeof val === 'object' && '$regex' in val) {
      const pattern = val.$regex;
      const options = val.$options || '';
      try {
        const regex = new RegExp(pattern, options);
        if (!regex.test(item[key] || '')) return false;
      } catch (e) {
        // If regex is invalid, treat as no match
        return false;
      }
      continue;
    }
    
    // Standard equality check
    let itemVal = item[key];
    let queryVal = val;
    
    if (itemVal && (itemVal._id || typeof itemVal === 'object' && itemVal.toString)) {
      itemVal = itemVal.toString();
    }
    if (queryVal && (queryVal._id || typeof queryVal === 'object' && queryVal.toString)) {
      queryVal = queryVal.toString();
    }
    
    if (itemVal !== queryVal) {
      return false;
    }
  }
  return true;
};

// Chainable Promise helper for Mongoose Queries
const createQueryPromise = (promiseCreator) => {
  const promise = promiseCreator();
  
  promise.populate = function(path, selectFields) {
    const populatedPromise = promise.then(res => {
      if (!res) return res;
      const users = data.users || [];
      
      const populateItem = (item) => {
        if (!item) return item;
        const newItem = { ...item };
        
        // Generic populate for any field that references users
        const refField = path; // e.g. 'customer', 'user'
        if (newItem[refField]) {
          const userId = newItem[refField].toString();
          const user = users.find(u => u._id.toString() === userId);
          if (user) {
            if (selectFields && typeof selectFields === 'string') {
              const fields = selectFields.split(' ');
              newItem[refField] = {};
              fields.forEach(f => {
                newItem[refField][f] = user[f];
              });
              newItem[refField]._id = user._id;
            } else {
              newItem[refField] = { _id: user._id, name: user.name, email: user.email, role: user.role };
            }
          }
        }
        return newItem;
      };
      
      if (Array.isArray(res)) {
        return res.map(populateItem);
      }
      return populateItem(res);
    });
    return createQueryPromise(() => populatedPromise);
  };
  
  promise.sort = function(sortObj) {
    const sortedPromise = promise.then(res => {
      if (Array.isArray(res) && sortObj) {
        let field = '';
        let desc = false;
        if (typeof sortObj === 'string') {
          field = sortObj.replace(/^-/, '');
          desc = sortObj.startsWith('-');
        } else if (typeof sortObj === 'object') {
          field = Object.keys(sortObj)[0];
          desc = sortObj[field] === -1 || sortObj[field] === 'desc';
        }
        
        return [...res].sort((a, b) => {
          const valA = a[field];
          const valB = b[field];
          if (valA === valB) return 0;
          if (valA == null) return desc ? 1 : -1;
          if (valB == null) return desc ? -1 : 1;
          return desc ? (valA < valB ? 1 : -1) : (valA > valB ? 1 : -1);
        });
      }
      return res;
    });
    return createQueryPromise(() => sortedPromise);
  };
  
  promise.select = function() { return this; };
  promise.exec = function() { return this; };
  
  return promise;
};

// Patch mongoose.Model static and prototype methods
const activateMockDB = () => {
  global.isMockDB = true;
  console.log('==================================================');
  console.log('⚠️  DATABASE WARNING: Running in MOCK DATABASE MODE');
  console.log('   All data will be persisted locally in:');
  console.log(`   ${mockFilePath}`);
  console.log('==================================================');

  // Override static find
  mongoose.Model.find = function(query = {}) {
    const colName = getCollection(this.modelName);
    const col = data[colName] || [];
    const results = col.filter(item => matchesQuery(item, query));
    const clonedResults = JSON.parse(JSON.stringify(results));
    return createQueryPromise(() => Promise.resolve(clonedResults));
  };

  // Override static findOne
  mongoose.Model.findOne = function(query = {}) {
    const colName = getCollection(this.modelName);
    const col = data[colName] || [];
    const result = col.find(item => matchesQuery(item, query));
    
    if (!result) {
      return createQueryPromise(() => Promise.resolve(null));
    }
    
    const doc = new this(result);
    doc.isNew = false;
    return createQueryPromise(() => Promise.resolve(doc));
  };

  // Override static findId
  mongoose.Model.findById = function(id) {
    const colName = getCollection(this.modelName);
    const col = data[colName] || [];
    const targetId = id ? id.toString() : '';
    const result = col.find(item => (item._id || '').toString() === targetId);
    
    if (!result) {
      return createQueryPromise(() => Promise.resolve(null));
    }
    
    const doc = new this(result);
    doc.isNew = false;
    return createQueryPromise(() => Promise.resolve(doc));
  };

  // Override static countDocuments
  mongoose.Model.countDocuments = function(query = {}) {
    const colName = getCollection(this.modelName);
    const col = data[colName] || [];
    const count = col.filter(item => matchesQuery(item, query)).length;
    return createQueryPromise(() => Promise.resolve(count));
  };

  // Override static findOneAndUpdate
  mongoose.Model.findOneAndUpdate = function(query, update, options = {}) {
    const colName = getCollection(this.modelName);
    const col = data[colName] || [];
    
    let index = col.findIndex(item => matchesQuery(item, query));
    if (index === -1) {
      if (options.upsert) {
        const newDoc = { _id: generateId(), ...query };
        const updateObj = update.$set || update.$inc || update;
        Object.assign(newDoc, updateObj);
        col.push(newDoc);
        saveMockData();
        return createQueryPromise(() => Promise.resolve(new this(newDoc)));
      }
      return createQueryPromise(() => Promise.resolve(null));
    }
    
    const current = col[index];
    const updated = { ...current };
    
    if (update.$set) {
      Object.assign(updated, update.$set);
    } else if (update.$inc) {
      for (const field of Object.keys(update.$inc)) {
        updated[field] = (Number(updated[field]) || 0) + Number(update.$inc[field]);
      }
    } else {
      Object.assign(updated, update);
    }
    
    col[index] = updated;
    saveMockData();
    
    const doc = new this(updated);
    doc.isNew = false;
    return createQueryPromise(() => Promise.resolve(doc));
  };

  // Override static findByIdAndUpdate
  mongoose.Model.findByIdAndUpdate = function(id, update, options = {}) {
    return this.findOneAndUpdate({ _id: id }, update, options);
  };

  // Override static create
  mongoose.Model.create = async function(docOrDocs, options) {
    const colName = getCollection(this.modelName);
    if (!data[colName]) {
      data[colName] = [];
    }
    const col = data[colName];

    const createSingle = async (docData) => {
      if (!docData._id) {
        docData._id = generateId();
      }
      
      const doc = new this(docData);
      
      if (this.modelName === 'User' && doc.password) {
        if (!doc.password.startsWith('$2a$')) {
          const salt = await bcrypt.genSalt(10);
          doc.password = await bcrypt.hash(doc.password, salt);
        }
      }
      
      if (this.modelName === 'Order') {
        doc.status = doc.status || 'Received';
        doc.statusLogs = doc.statusLogs || [];
        if (doc.statusLogs.length === 0) {
          doc.statusLogs.push({
            status: doc.status,
            timestamp: new Date()
          });
        }
      }

      const plainObj = JSON.parse(JSON.stringify(doc.toObject()));
      plainObj.createdAt = new Date().toISOString();
      plainObj.updatedAt = new Date().toISOString();
      
      col.push(plainObj);
      saveMockData();
      
      const resultDoc = new this(plainObj);
      resultDoc.isNew = false;
      return resultDoc;
    };

    if (Array.isArray(docOrDocs)) {
      const results = [];
      for (const d of docOrDocs) {
        results.push(await createSingle(d));
      }
      return results;
    } else {
      return await createSingle(docOrDocs);
    }
  };

  // Override static insertMany
  mongoose.Model.insertMany = async function(docs) {
    return this.create(docs);
  };

  // Override static deleteOne
  mongoose.Model.deleteOne = function(query = {}) {
    const colName = getCollection(this.modelName);
    const col = data[colName] || [];
    const index = col.findIndex(item => matchesQuery(item, query));
    if (index !== -1) {
      col.splice(index, 1);
      saveMockData();
    }
    return createQueryPromise(() => Promise.resolve({ deletedCount: index !== -1 ? 1 : 0 }));
  };

  // Override static deleteMany
  mongoose.Model.deleteMany = function(query = {}) {
    const colName = getCollection(this.modelName);
    const col = data[colName] || [];
    const initialLength = col.length;
    data[colName] = col.filter(item => !matchesQuery(item, query));
    const deletedCount = initialLength - data[colName].length;
    if (deletedCount > 0) {
      saveMockData();
    }
    return createQueryPromise(() => Promise.resolve({ deletedCount }));
  };

  // Override instance save
  mongoose.Model.prototype.save = async function(options) {
    const modelName = this.constructor.modelName;
    const colName = getCollection(modelName);
    if (!data[colName]) {
      data[colName] = [];
    }
    const col = data[colName];
    
    if (!this._id) {
      this._id = generateId();
    }
    const targetId = this._id.toString();

    if (modelName === 'User' && this.isModified && this.isModified('password') && this.password) {
      if (!this.password.startsWith('$2a$')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
      }
    }

    if (modelName === 'Order') {
      const isNewOrder = !col.some(item => (item._id || '').toString() === targetId);
      const existing = col.find(item => (item._id || '').toString() === targetId);
      
      this.statusLogs = this.statusLogs || [];
      if (isNewOrder && this.statusLogs.length === 0) {
        this.statusLogs.push({
          status: this.status || 'Received',
          timestamp: new Date()
        });
      } else if (existing && existing.status !== this.status) {
        this.statusLogs.push({
          status: this.status,
          timestamp: new Date()
        });
      }
    }

    const plainObj = JSON.parse(JSON.stringify(this.toObject()));
    plainObj.updatedAt = new Date().toISOString();

    const index = col.findIndex(item => (item._id || '').toString() === targetId);
    if (index === -1) {
      plainObj.createdAt = new Date().toISOString();
      col.push(plainObj);
    } else {
      plainObj.createdAt = col[index].createdAt || new Date().toISOString();
      col[index] = plainObj;
    }

    saveMockData();
    this.isNew = false;
    return this;
  };

  // Override instance deleteOne
  mongoose.Model.prototype.deleteOne = async function() {
    const modelName = this.constructor.modelName;
    const colName = getCollection(modelName);
    const col = data[colName] || [];
    const targetId = (this._id || '').toString();
    const index = col.findIndex(item => (item._id || '').toString() === targetId);
    if (index !== -1) {
      col.splice(index, 1);
      saveMockData();
    }
    return { deletedCount: index !== -1 ? 1 : 0 };
  };
};

module.exports = {
  activateMockDB,
  mockData: data
};
