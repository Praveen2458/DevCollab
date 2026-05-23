import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Room } from '../models/Room.js';
import { SharedNote } from '../models/SharedNote.js';

export const getRoomNote = asyncHandler(async (req, res) => {
  const { roomId } = req.validated.params;

  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError('Room not found', 404);

  const isMember = room.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isMember) throw new AppError('You are not a participant in this room', 403);

  const note = await SharedNote.findOne({ room: room._id });
  res.json({ note: note || { content: '' } });
});

export const updateRoomNote = asyncHandler(async (req, res) => {
  const { roomId } = req.validated.params;
  const { content } = req.validated.body;

  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError('Room not found', 404);

  const isMember = room.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isMember) throw new AppError('You are not a participant in this room', 403);

  const note = await SharedNote.findOneAndUpdate(
    { room: room._id },
    { content, updatedBy: req.user._id },
    { new: true, upsert: true }
  );

  res.json({ note });
});
