const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const authRoutes = require('./modules/auth/auth.routes');
const roomsRoutes = require('./modules/rooms/rooms.routes');
const reservationsRoutes = require('./modules/reservations/reservations.routes');
const paymentsRoutes = require('./modules/payments/payments.routes');
const restaurantRoutes = require('./modules/restaurant/restaurant.routes');
const eventsRoutes = require('./modules/events/events.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);

      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://ai-hotel.onrender.com',
        'https://ai-hotel-six.vercel.app',
        process.env.CLIENT_URL,
      ].filter(Boolean).map(o => o.replace(/\/$/, ''));

      const normalized = origin.replace(/\/$/, '');

      if (allowedOrigins.includes(normalized) || normalized.endsWith('.vercel.app')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS: ' + origin));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  })
);

// Logging
app.use(morgan('combined'));

// Pre-flight OPTIONS for all routes (must be before rate limiter)
app.options('*', cors());

// Rate limiting – general API
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
});
app.use(limiter);

// Rate limiting – AI chat (more generous for conversational use)
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  keyGenerator: (req) => req.user?.id || req.ip,
  message: { success: false, error: 'Too many messages. Please wait a moment.' },
});
app.use('/api/ai/chat', chatLimiter);

// Body parser with raw body saved for webhooks
app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
