import express from 'express';
import { z } from 'zod';
import { createRoom, deleteRoom, getRoomDetails, joinRoom, listMyRooms } from '../controllers/roomController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

const createRoomSchema = z.object({
  body: z.object({
    title: z.string().min(2).max(80),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const joinRoomSchema = z.object({
  body: z.object({
    roomId: z.string().min(4).max(20),
  }),
  params: z.object({}).optional(),
  query: z.object({}).optional(),
});

const roomIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    roomId: z.string().min(4).max(20),
  }),
  query: z.object({}).optional(),
});

router.use(requireAuth);

router.get('/', listMyRooms);
router.post('/', validate(createRoomSchema), createRoom);
router.post('/join', validate(joinRoomSchema), joinRoom);
router.get('/:roomId', validate(roomIdParamSchema), getRoomDetails);
router.delete('/:roomId', validate(roomIdParamSchema), deleteRoom);

export default router;
