import { Server } from 'socket.io';
import { verifyAccessToken } from '../services/tokenService.js';
import { User } from '../models/User.js';
import { Room } from '../models/Room.js';
import { Message } from '../models/Message.js';
import { SharedNote } from '../models/SharedNote.js';

function parseCookies(cookieHeader) {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const [k, ...v] = part.trim().split('=');
    if (!k) return acc;
    acc[k] = decodeURIComponent(v.join('=') || '');
    return acc;
  }, {});
}

function getSocketToken(socket) {
  const authToken = socket.handshake.auth?.token;
  if (authToken) return authToken;

  const cookies = parseCookies(socket.request.headers.cookie);
  if (cookies.token) return cookies.token;

  const header = socket.request.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);

  return null;
}

export function initSockets(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN?.split(',').map((s) => s.trim()) || true,
      credentials: true,
    },
  });

  const online = new Map(); // userId -> Set(socketId)
  const pendingNoteSaves = new Map(); // roomId -> { timer, content, updatedBy }

  const isOnline = (userId) => {
    const set = online.get(userId);
    return Boolean(set && set.size > 0);
  };

  const addOnline = (userId, socketId) => {
    if (!online.has(userId)) online.set(userId, new Set());
    online.get(userId).add(socketId);
  };

  const removeOnline = (userId, socketId) => {
    const set = online.get(userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) online.delete(userId);
  };

  const emitRoomParticipants = async (roomId) => {
    const room = await Room.findOne({ roomId }).populate('participants', 'name');
    if (!room) return;

    const participants = room.participants.map((p) => ({
      _id: p._id,
      name: p.name,
      isOnline: isOnline(p._id.toString()),
    }));

    io.to(roomId).emit('room:participants', {
      roomId,
      participants,
    });
  };

  io.use(async (socket, next) => {
    const token = getSocketToken(socket);
    if (!token) return next(new Error('Not authenticated'));

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      return next(new Error('Invalid token'));
    }

    const user = await User.findById(decoded.sub);
    if (!user) return next(new Error('User not found'));

    socket.user = { _id: user._id.toString(), name: user.name };
    next();
  });

  io.on('connection', (socket) => {
    addOnline(socket.user._id, socket.id);

    socket.on('room:join', async ({ roomId }) => {
      if (!roomId) return;

      const room = await Room.findOne({ roomId });
      if (!room) {
        socket.emit('room:error', { message: 'Room not found' });
        return;
      }

      const already = room.participants.some((p) => p.toString() === socket.user._id);
      if (!already) {
        room.participants.push(socket.user._id);
        await room.save();
      }

      await SharedNote.findOneAndUpdate(
        { room: room._id },
        { $setOnInsert: { content: '' } },
        { upsert: true, new: true }
      );

      socket.join(roomId);

      await emitRoomParticipants(roomId);

      const note = await SharedNote.findOne({ room: room._id });
      socket.emit('notes:sync', {
        roomId,
        content: note?.content || '',
        updatedAt: note?.updatedAt || null,
        updatedBy: note?.updatedBy || null,
      });
    });

    socket.on('chat:send', async ({ roomId, content }) => {
      if (!roomId || !content?.trim()) return;

      const room = await Room.findOne({ roomId });
      if (!room) return;

      const isMember = room.participants.some((p) => p.toString() === socket.user._id);
      if (!isMember) return;

      const message = await Message.create({
        room: room._id,
        sender: socket.user._id,
        content: content.trim(),
      });

      io.to(roomId).emit('chat:new', {
        _id: message._id,
        roomId,
        sender: { _id: socket.user._id, name: socket.user.name },
        content: message.content,
        createdAt: message.createdAt,
      });
    });

    socket.on('notes:update', async ({ roomId, content }) => {
      if (!roomId) return;

      const room = await Room.findOne({ roomId });
      if (!room) return;

      const isMember = room.participants.some((p) => p.toString() === socket.user._id);
      if (!isMember) return;

      socket.to(roomId).emit('notes:sync', {
        roomId,
        content: content ?? '',
        updatedAt: new Date().toISOString(),
        updatedBy: { _id: socket.user._id, name: socket.user.name },
      });

      const existing = pendingNoteSaves.get(roomId);
      if (existing?.timer) clearTimeout(existing.timer);

      const timer = setTimeout(async () => {
        try {
          const roomForSave = await Room.findOne({ roomId });
          if (!roomForSave) return;

          await SharedNote.findOneAndUpdate(
            { room: roomForSave._id },
            { content: content ?? '', updatedBy: socket.user._id },
            { upsert: true }
          );
        } finally {
          pendingNoteSaves.delete(roomId);
        }
      }, 900);

      pendingNoteSaves.set(roomId, { timer, content: content ?? '', updatedBy: socket.user._id });
    });

    socket.on('disconnect', async () => {
      removeOnline(socket.user._id, socket.id);

      const joinedRooms = Array.from(socket.rooms).filter((r) => r !== socket.id);
      await Promise.all(joinedRooms.map((rid) => emitRoomParticipants(rid)));
    });
  });

  return io;
}
