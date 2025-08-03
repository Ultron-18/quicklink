const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

// Import routes
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3001;
const isProduction = process.env.NODE_ENV === 'production';

// Trust proxy for accurate IP addresses (important for Render, Heroku, etc.)
app.set('trust proxy', 1);

// Compression middleware for better performance
app.use(compression());

// Enhanced security middleware for production
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.rebrandly.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Enhanced CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = process.env.FRONTEND_URL 
      ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
      : ['http://localhost:5173', 'http://localhost:3000'];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));

// Enhanced rate limiting with different tiers
const createRateLimit = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// General API rate limiting
const generalLimiter = createRateLimit(
  parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  'Too many requests from this IP, please try again later.'
);

// Strict rate limiting for URL shortening endpoint
const shortenLimiter = createRateLimit(
  5 * 60 * 1000, // 5 minutes
  parseInt(process.env.SHORTEN_RATE_LIMIT) || 20, // 20 requests per 5 minutes
  'Too many URL shortening requests. Please wait before creating more links.'
);

// Apply rate limiting
app.use('/api/', generalLimiter);
app.use('/api/shorten', shortenLimiter);

// Body parser middleware with size limits
app.use(express.json({ 
  limit: '1mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      return;
    }
  }
}));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logging middleware (only in development)
if (!isProduction) {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthData = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: process.env.npm_package_version || '1.0.0'
  };
  
  // Add additional checks in production
  if (isProduction) {
    healthData.checks = {
      rebrandlyApi: process.env.REBRANDLY_API_KEY ? 'configured' : 'missing',
      frontendUrl: process.env.FRONTEND_URL ? 'configured' : 'missing'
    };
  }
  
  res.json(healthData);
});

// API routes
app.use('/api', apiRoutes);

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  // Log error details
  console.error('Error occurred:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    ip: req.ip,
    error: err.message,
    stack: isProduction ? undefined : err.stack
  });
  
  // CORS error handling
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      error: 'CORS policy violation',
      message: 'Origin not allowed'
    });
  }
  
  // Rate limit error handling
  if (err.status === 429) {
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later'
    });
  }
  
  // Default error response
  const errorResponse = {
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  };
  
  // Include error details only in development
  if (!isProduction) {
    errorResponse.details = err.message;
    errorResponse.stack = err.stack;
  }
  
  res.status(err.status || 500).json(errorResponse);
});

// Enhanced 404 handler
app.use('*', (req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Unhandled promise rejection handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (isProduction) {
    process.exit(1);
  }
});

// Uncaught exception handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  if (isProduction) {
    process.exit(1);
  }
});

// Start server with enhanced logging
const server = app.listen(PORT, () => {
  console.log('🚀 QuickLink Server Started');
  console.log('═'.repeat(50));
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
  console.log(`🔑 API Key: ${process.env.REBRANDLY_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`⏰ Started: ${new Date().toISOString()}`);
  console.log(`🛡️  Security: ${isProduction ? 'Production Mode' : 'Development Mode'}`);
  console.log('═'.repeat(50));
  
  if (!process.env.REBRANDLY_API_KEY) {
    console.warn('⚠️  WARNING: REBRANDLY_API_KEY not configured!');
  }
  
  if (!process.env.FRONTEND_URL && isProduction) {
    console.warn('⚠️  WARNING: FRONTEND_URL not configured for production!');
  }
});

// Handle server startup errors
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server startup error:', error);
    process.exit(1);
  }
});

module.exports = app;