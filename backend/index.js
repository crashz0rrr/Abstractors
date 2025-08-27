const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables FIRST
dotenv.config();

console.log('🔧 Starting server initialization...');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Basic health check route
app.get('/api/healthcheck', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'spacegame-api',
    database: global.dbConnected || false
  });
});

// Simple mock routes for testing
app.get('/api/user/:address', (req, res) => {
  const { address } = req.params;
  res.json({
    success: true,
    data: {
      address: address,
      username: `user_${address.slice(2, 8)}`,
      level: Math.floor(Math.random() * 50) + 1,
      experience: Math.floor(Math.random() * 10000),
      // Mock resources
      resources: {
        ufo: Math.floor(Math.random() * 1000),
        energy: Math.floor(Math.random() * 500),
        minerals: Math.floor(Math.random() * 800)
      }
    }
  });
});

app.get('/api/user/:address/fleet', (req, res) => {
  const { address } = req.params;
  res.json({
    success: true,
    data: [
      {
        id: 1,
        type: 'explorer',
        name: 'Explorer Ship',
        level: Math.floor(Math.random() * 10) + 1,
        strength: Math.floor(Math.random() * 100) + 50
      },
      {
        id: 2,
        type: 'miner',
        name: 'Mining Vessel',
        level: Math.floor(Math.random() * 8) + 1,
        strength: Math.floor(Math.random() * 80) + 30
      }
    ]
  });
});

app.get('/api/marketplace/listings', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        type: 'ship',
        name: 'Explorer Ship',
        price: 100,
        seller: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
      },
      {
        id: 2,
        type: 'resource',
        name: 'Uranium',
        price: 25,
        seller: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e'
      }
    ]
  });
});

app.get('/api/packs', (req, res) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        name: 'Starter Pack',
        price: 10,
        contains: ['Explorer Ship', '100 UFO', '50 Energy']
      },
      {
        id: 2,
        name: 'Miner Pack',
        price: 25,
        contains: ['Mining Vessel', '250 UFO', '100 Minerals']
      }
    ]
  });
});

// Mock auth endpoint
app.post('/api/auth/token', (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({
      success: false,
      error: 'Address is required'
    });
  }
  
  // Generate a simple mock token
  const mockToken = `mock_token_${address.slice(2, 10)}_${Date.now()}`;
  
  res.json({
    success: true,
    token: mockToken,
    address: address
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Simple error handler
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Database connection with better error handling
async function connectDatabase() {
  try {
    // Check if mongoose is available
    const mongoose = require('mongoose');
    
    // Check if DATABASE_URL is set
    if (!process.env.DATABASE_URL) {
      console.log('ℹ️ DATABASE_URL not set, skipping database connection');
      return false;
    }
    
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log('✅ MongoDB Connected');
    global.dbConnected = true;
    return true;
  } catch (error) {
    console.log('❌ MongoDB connection failed:', error.message);
    console.log('ℹ️ Continuing without database - using mock data');
    global.dbConnected = false;
    return false;
  }
}

// Start server - minimal initialization
async function startServer() {
  try {
    console.log('🔄 Starting server with minimal configuration...');
    
    // Try to connect to database (won't crash if it fails)
    await connectDatabase();

    app.listen(PORT, () => {
      console.log('');
      console.log('='.repeat(50));
      console.log(`🚀 SpaceGame API server running!`);
      console.log(`📡 http://localhost:${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🗄️  Database: ${global.dbConnected ? '✅ Connected' : '❌ Using mock data'}`);
      console.log('='.repeat(50));
      console.log('\n✅ Server is ready!');
      console.log('💡 Available endpoints:');
      console.log(`   GET  /api/healthcheck`);
      console.log(`   GET  /api/user/:address`);
      console.log(`   GET  /api/user/:address/fleet`);
      console.log(`   GET  /api/marketplace/listings`);
      console.log(`   GET  /api/packs`);
      console.log(`   POST /api/auth/token`);
    });
  } catch (error) {
    console.error('❌ Server failed to start:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🔻 Shutting down...');
  process.exit(0);
});

// Start the server
startServer().catch(error => {
  console.error('❌ Critical error:', error.message);
  process.exit(1);
});

module.exports = app;