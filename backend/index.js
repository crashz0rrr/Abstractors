const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import configs
const connectDatabase = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');

// Import services
const moralisService = require('./src/services/moralisService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Import routes
app.use('/api/healthcheck', require('./src/routes/healthcheck'));
app.use('/api/user', require('./src/routes/user'));
app.use('/api/marketplace', require('./src/routes/marketplace'));
app.use('/api/packs', require('./src/routes/packs'));
app.use('/api/rewards', require('./src/routes/rewards'));
app.use('/api/stats', require('./src/routes/stats'));
app.use('/api/auth', require('./src/routes/auth'));

// Import error handler
const errorHandler = require('./src/middlewares/errorHandler');
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Endpoint not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server with all connections
async function startServer() {
  try {
    // Connect to databases
    await connectDatabase();
    // await connectRedis();
    await moralisService.initialize();

    app.listen(PORT, () => {
      console.log(`🚀 SpaceGame API running on port ${PORT}`);
      console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
      console.log(`📚 Health check: http://localhost:${PORT}/api/healthcheck`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);

module.exports = app;