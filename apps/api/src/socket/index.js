import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import cookie from 'cookie';

// Track online members per workspace: Map<workspaceId, Set<userId>>
const workspaceOnlineMembers = new Map();

// Map to track user's active workspace per socket: Map<socketId, { userId, workspaceId }>
const socketSessions = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket, next) => {
    try {
      const cookies = cookie.parse(socket.handshake.headers.cookie || '');
      const token = cookies.accessToken || socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      socket.user = decoded; // Contains userId
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.userId;

    // --- Client -> Server Events ---

    socket.on('workspace:join', (workspaceId) => {
      // Leave previous workspace if any
      const session = socketSessions.get(socket.id);
      if (session && session.workspaceId !== workspaceId) {
        handleLeaveWorkspace(socket, session.workspaceId);
      }

      // Join new workspace room
      socket.join(workspaceId);
      socketSessions.set(socket.id, { userId, workspaceId });

      // Track online status
      if (!workspaceOnlineMembers.has(workspaceId)) {
        workspaceOnlineMembers.set(workspaceId, new Set());
      }
      workspaceOnlineMembers.get(workspaceId).add(userId);

      // Broadcast updated online list to the room
      broadcastOnlineMembers(io, workspaceId);
    });

    socket.on('workspace:leave', (workspaceId) => {
      handleLeaveWorkspace(socket, workspaceId);
    });

    socket.on('typing:start', ({ workspaceId, announcementId }) => {
      socket.to(workspaceId).emit('typing:start', { userId, announcementId });
    });

    socket.on('typing:stop', ({ workspaceId, announcementId }) => {
      socket.to(workspaceId).emit('typing:stop', { userId, announcementId });
    });

    socket.on('disconnect', () => {
      const session = socketSessions.get(socket.id);
      if (session) {
        handleLeaveWorkspace(socket, session.workspaceId);
      }
      socketSessions.delete(socket.id);
    });
  });

  return io;
};

// --- Helper Functions ---

const handleLeaveWorkspace = (socket, workspaceId) => {
  const userId = socket.user.userId;
  socket.leave(workspaceId);
  
  if (workspaceOnlineMembers.has(workspaceId)) {
    const members = workspaceOnlineMembers.get(workspaceId);
    members.delete(userId);
    
    if (members.size === 0) {
      workspaceOnlineMembers.delete(workspaceId);
    } else {
      // Broadcast updated online list
      broadcastOnlineMembers(socket.server, workspaceId);
    }
  }
};

const broadcastOnlineMembers = (io, workspaceId) => {
  const members = workspaceOnlineMembers.get(workspaceId);
  const onlineList = members ? Array.from(members) : [];
  io.to(workspaceId).emit('members:online', onlineList);
};

// --- Utility for triggering emits from Controllers ---
// Note: io instance will be attached to app for easy access in controllers
export const socketEmit = (io, workspaceId, event, data) => {
  if (workspaceId) {
    io.to(workspaceId).emit(event, data);
  }
};

export const socketNotifyUser = (io, userId, data) => {
  // Find all sockets for this user across all rooms
  // In a production app, we'd maintain a Map<userId, Set<socketId>>
  // For now, we iterate over connected sockets (fine for smaller scale)
  io.sockets.sockets.forEach((socket) => {
    if (socket.user?.userId === userId) {
      socket.emit('notification:new', data);
    }
  });
};
