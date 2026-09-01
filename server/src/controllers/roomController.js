import { nanoid } from 'nanoid';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { Room } from '../models/Room.js';
import { SharedNote } from '../models/SharedNote.js';
import { Message } from '../models/Message.js';

export const listMyRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ participants: req.user._id })
    .sort({ updatedAt: -1 })
    .select('title roomId createdBy createdAt updatedAt participants')
    .populate('participants', 'name');

  res.json({ rooms });
});

export const createRoom = asyncHandler(async (req, res) => {
  const { title } = req.validated.body;

  const room = await Room.create({
    title,
    roomId: nanoid(8),
    createdBy: req.user._id,
    participants: [req.user._id],
  });

  await SharedNote.create({ room: room._id, content: '', updatedBy: req.user._id });

  res.status(201).json({ room });
});

export const joinRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.validated.body;

  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError('Room not found', 404);

  const already = room.participants.some((p) => p.toString() === req.user._id.toString());
  if (!already) {
    room.participants.push(req.user._id);
    await room.save();
  }

  const note = await SharedNote.findOne({ room: room._id });
  if (!note) {
    await SharedNote.create({ room: room._id, content: '', updatedBy: req.user._id });
  }

  res.json({ room });
});

export const getRoomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.validated.params;

  const room = await Room.findOne({ roomId }).populate('participants', 'name');
  if (!room) throw new AppError('Room not found', 404);

  const isMember = room.participants.some((p) => p._id.toString() === req.user._id.toString());
  if (!isMember) throw new AppError('You are not a participant in this room', 403);

  res.json({ room });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.validated.params;

  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError('Room not found', 404);

  const isCreator = room.createdBy.toString() === req.user._id.toString();
  if (!isCreator) throw new AppError('Only the room creator can delete this room', 403);

  await Promise.all([
    SharedNote.deleteOne({ room: room._id }),
    Message.deleteMany({ room: room._id }),
    Room.deleteOne({ _id: room._id }),
  ]);

  res.json({ ok: true });
});

export const leaveRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.validated.params;

  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError('Room not found', 404);

  const isCreator = room.createdBy.toString() === req.user._id.toString();
  if (isCreator) throw new AppError('Room owner cannot leave. Transfer ownership or delete the room.', 400);

  const isMember = room.participants.some((p) => p.toString() === req.user._id.toString());
  if (!isMember) throw new AppError('You are not in this room', 400);

  room.participants = room.participants.filter((p) => p.toString() !== req.user._id.toString());
  await room.save();

  res.json({ ok: true });
});

export const kickParticipant = asyncHandler(async (req, res) => {
  const { roomId, userId } = req.validated.params;

  const room = await Room.findOne({ roomId });
  if (!room) throw new AppError('Room not found', 404);

  const isCreator = room.createdBy.toString() === req.user._id.toString();
  if (!isCreator) throw new AppError('Only the room owner can remove participants', 403);

  if (userId === req.user._id.toString()) {
    throw new AppError('You cannot remove yourself. Delete the room instead.', 400);
  }

  const isMember = room.participants.some((p) => p.toString() === userId);
  if (!isMember) throw new AppError('User is not in this room', 400);

  room.participants = room.participants.filter((p) => p.toString() !== userId);
  await room.save();

  res.json({ ok: true });
});
