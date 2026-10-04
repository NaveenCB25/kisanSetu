/**
 * Socket.IO service — handles real-time connections and events
 */
const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join user-specific room for notifications
    socket.on('join:user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their room`);
    });

    // Join center room for queue updates
    socket.on('join:center', (centerId) => {
      socket.join(`center:${centerId}`);
      console.log(`Socket ${socket.id} joined center ${centerId}`);
    });

    // Leave center room
    socket.on('leave:center', (centerId) => {
      socket.leave(`center:${centerId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emit queue update to all users watching a center
 */
const emitQueueUpdate = (io, centerId, queueData) => {
  io.to(`center:${centerId}`).emit('queue:update', queueData);
};

/**
 * Emit booking status change to the specific farmer
 */
const emitBookingStatusChange = (io, userId, bookingData) => {
  io.to(`user:${userId}`).emit('booking:statusChanged', bookingData);
};

/**
 * Emit "call next farmer" event
 */
const emitCallNext = (io, centerId, data) => {
  io.to(`center:${centerId}`).emit('center:callNext', data);
};

module.exports = { setupSocket, emitQueueUpdate, emitBookingStatusChange, emitCallNext };
