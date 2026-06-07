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
const errorHandler = require('./middleware/errorHandler');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const app = express();

// Security middleware
app.use(helmet());

// CORS
app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'https://ai-hotel.onrender.com',
      process.env.CLIENT_URL
    ].filter(Boolean),
    credentials: true,
  })
);

// Logging
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

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
