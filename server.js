const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiKeyAuth = require('./middleware/apiKeyAuth');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200
};

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100 // limit each IP to 100 requests per windowMs
});

// Add this new import
const { setTimeout } = require('timers/promises');

// Add this delay middleware function
const delayMiddleware = async (req, res, next) => {
  await setTimeout(3000); // 3 seconds delay
  next();
};

// Middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(limiter);

// Add the delay middleware here, before the API key middleware
app.use(delayMiddleware);

// Apply API Key middleware globally
app.use(apiKeyAuth);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Import routes
const fleetRoutes = require('./routes/fleetRoutes');
const vehicleRoutes = require('./routes/vehicleRoutes');

// Use routes
app.use('/api/fleet', fleetRoutes);
app.use('/api/vehicle', vehicleRoutes);

// Start server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  server.close(() => {
    console.log('HTTP server closed')
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed')
      process.exit(0)
    })
  })
})