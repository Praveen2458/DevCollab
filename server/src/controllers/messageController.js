import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Room } from '../models/Room.js';
import { Message } from '../models/Message.js';

export const listRoomMessages = asyncHandler(async (req, res) => {
  const { roomId } = req.validated.params;

  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError('Room not found', 404);

  const isMember = room.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isMember) throw new AppError('You are not a participant in this room', 403);

  const messages = await Message.find({ room: room._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('sender', 'name');

  res.json({ messages: messages.reverse() });
});
