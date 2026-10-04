require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/db');
const { initFirebase } = require('./config/firebase');
const { setupSocket } = require('./services/socketService');
const NotificationService = require('./services/notificationService');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
const centerRoutes = require('./routes/centers');
const adminRoutes = require('./routes/admin');
const queueRoutes = require('./routes/queue');
const slotRoutes = require('./routes/slots');
const notificationRoutes = require('./routes/notifications');
const procurementRoutes = require('./routes/procurements');

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Initialize Firebase
initFirebase();

// Setup Socket.IO
setupSocket(io);

// Make io and notification service available in routes
app.set('io', io);
const notificationService = new NotificationService(io);
app.set('notificationService', notificationService);

// Middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/centers', centerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/procurements', procurementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'KisanSetu API is running 🌾', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════╗
║       🌾 KisanSetu Server Running 🌾        ║
║──────────────────────────────────────────────║
║  Port:     ${PORT}                             ║
║  Mode:     ${process.env.NODE_ENV || 'development'}                    ║
║  API:      http://localhost:${PORT}/api          ║
║  Health:   http://localhost:${PORT}/api/health   ║
╚══════════════════════════════════════════════╝
    `);
  });
};

start();
