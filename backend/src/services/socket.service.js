const { Server } = require('socket.io');
const logger = require('./logger.service');

/**
 * WebSocket Service — Real-time Updates
 *
 * Provides real-time event push for:
 * - Queue updates (receptionist sees patient check-in instantly)
 * - New appointments for doctors
 * - Prescription verification for pharmacists
 * - Notification events across all roles
 *
 * Usage:
 *   // Server-side emit:
 *   io.to(`room:receptionist`).emit('queue:updated', { ... });
 *   io.to(`room:doctor:${doctorId}`).emit('new:appointment', { ... });
 *
 *   // Client-side connect:
 *   const socket = io('/', { auth: { token } });
 *   socket.on('queue:updated', (data) => { ... });
 */

let io = null;

/**
 * Initialize Socket.io server attached to an HTTP server.
 * Called from server.js after the HTTP server is created.
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Authentication middleware — extract user from JWT
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      // Decode token to get user info (verify with jsonwebtoken)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn('Socket.io authentication failed', { error: err.message });
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const { user } = socket;
    logger.info(`Socket connected: ${user.email || socket.id} (${user.role})`);

    // Join role-based rooms for broadcast
    socket.join(`room:${user.role}`);

    // Join user-specific room for private messages
    socket.join(`room:user:${user._id}`);

    // Doctor-specific room
    if (user.role === 'doctor' && user._id) {
      socket.join(`room:doctor:${user._id}`);
    }

    // Appointment check-in event (receptionist → doctor queue)
    socket.on('appointment:checkin', (data) => {
      logger.info('Patient checked in', { appointmentId: data?.appointmentId, by: user.email });
      io.to('room:doctor').emit('queue:updated', {
        type: 'CHECKIN',
        message: `Patient checked in for appointment`,
        appointmentId: data?.appointmentId,
        timestamp: new Date(),
        by: { id: user._id, name: user.fullName },
      });
    });

    // Prescription status updated (doctor → pharmacist)
    socket.on('prescription:approved', (data) => {
      logger.info('Prescription approved', { prescriptionId: data?.prescriptionId, by: user.email });
      io.to('room:pharmacist').emit('prescription:ready', {
        type: 'NEW_PRESCRIPTION',
        message: 'New approved prescription ready for verification',
        prescriptionId: data?.prescriptionId,
        timestamp: new Date(),
      });
    });

    // Queue status update from backend
    socket.on('queue:status', (data) => {
      io.to('room:receptionist').emit('queue:updated', {
        type: 'STATUS_UPDATE',
        ...data,
        timestamp: new Date(),
      });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${user.email || socket.id} - ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error('Socket error', { error: err.message, socketId: socket.id });
    });
  });

  logger.info('Socket.io initialized');
  return io;
}

/**
 * Get the Socket.io server instance.
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket() first.');
  }
  return io;
}

/**
 * Emit event to a specific room.
 */
function emitToRoom(room, event, data) {
  if (!io) return;
  io.to(room).emit(event, data);
}

/**
 * Emit event to all connected clients.
 */
function emitBroadcast(event, data) {
  if (!io) return;
  io.emit(event, data);
}

module.exports = {
  initSocket,
  getIO,
  emitToRoom,
  emitBroadcast,
};

