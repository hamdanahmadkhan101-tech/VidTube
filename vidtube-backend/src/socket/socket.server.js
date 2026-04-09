import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { User } from '../models/user.model.js';
import { getAllowedOrigins } from '../config/cors.config.js';

let ioInstance = null;

const socketDiagnostics = {
  activeConnections: 0,
  totalConnections: 0,
  disconnectedConnections: 0,
  authFailures: 0,
  emittedEvents: 0,
  emittedWithoutSubscribers: 0,
  lastConnectionAt: null,
  lastDisconnectAt: null,
  lastEmitAt: null,
};

const extractToken = (socket) => {
  const authToken = socket.handshake.auth?.token;
  const headerToken = socket.handshake.headers?.authorization;
  const queryToken = socket.handshake.query?.token;
  const candidate = authToken || headerToken || queryToken;

  if (typeof candidate !== 'string') {
    return null;
  }

  const token = candidate.replace('Bearer ', '').trim();
  return token || null;
};

const socketAuthMiddleware = async (socket, next) => {
  const token = extractToken(socket);
  if (!token) {
    socketDiagnostics.authFailures += 1;
    return next(new Error('Unauthorized'));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decoded._id)
      .select('_id isBanned bannedUntil')
      .lean();

    if (!user) {
      socketDiagnostics.authFailures += 1;
      return next(new Error('Unauthorized'));
    }

    const banExpired =
      user.bannedUntil && new Date(user.bannedUntil) <= new Date();
    if (user.isBanned && !banExpired) {
      socketDiagnostics.authFailures += 1;
      return next(new Error('Forbidden'));
    }

    socket.data.userId = user._id.toString();
    return next();
  } catch {
    socketDiagnostics.authFailures += 1;
    return next(new Error('Unauthorized'));
  }
};

export const initializeSocketServer = (httpServer) => {
  if (ioInstance) {
    return ioInstance;
  }

  const allowedOrigins = getAllowedOrigins();

  ioInstance = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  ioInstance.use(socketAuthMiddleware);

  ioInstance.on('connection', (socket) => {
    socketDiagnostics.totalConnections += 1;
    socketDiagnostics.activeConnections += 1;
    socketDiagnostics.lastConnectionAt = new Date().toISOString();

    const userId = socket.data.userId;
    socket.join(`user:${userId}`);
    socket.emit('socket:connected', { userId });

    socket.on('disconnect', () => {
      socketDiagnostics.activeConnections = Math.max(
        0,
        socketDiagnostics.activeConnections - 1
      );
      socketDiagnostics.disconnectedConnections += 1;
      socketDiagnostics.lastDisconnectAt = new Date().toISOString();
    });
  });

  return ioInstance;
};

export const emitToUser = (userId, event, payload) => {
  if (!ioInstance || !userId) {
    return false;
  }

  const roomName = `user:${String(userId)}`;
  const subscriberCount =
    ioInstance.sockets.adapter.rooms.get(roomName)?.size || 0;

  socketDiagnostics.emittedEvents += 1;
  socketDiagnostics.lastEmitAt = new Date().toISOString();
  if (subscriberCount === 0) {
    socketDiagnostics.emittedWithoutSubscribers += 1;
  }

  ioInstance.to(roomName).emit(event, payload);
  return subscriberCount > 0;
};

export const getSocketDiagnostics = () => {
  const activeUserRooms = ioInstance
    ? [...ioInstance.sockets.adapter.rooms.keys()].filter((room) =>
        room.startsWith('user:')
      ).length
    : 0;

  return {
    ...socketDiagnostics,
    activeUserRooms,
  };
};

export const closeSocketServer = () =>
  new Promise((resolve) => {
    if (!ioInstance) {
      resolve();
      return;
    }

    ioInstance.close(() => {
      ioInstance = null;
      resolve();
    });
  });
