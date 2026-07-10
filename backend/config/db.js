const mongoose = require('mongoose');
const { activateMockDB } = require('./mockDb');

const connectDB = async () => {
  try {
    global.isMockDB = false;
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/perfectpie', {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s to allow Atlas connections
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.log('Ensure MongoDB is running locally or check your MONGODB_URI.');
    console.log('Switching to local Mock Database...');
    activateMockDB();
  }
};

module.exports = connectDB;
