import express from 'express';
import { z } from 'zod';
import { getRoomNote, updateRoomNote } from '../controllers/noteController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router({ mergeParams: true });

const roomIdParamSchema = z.object({
  body: z.object({}).optional(),
  params: z.object({
    roomId: z.string().min(4).max(20),
  }),
  query: z.object({}).optional(),
});

const updateSchema = z.object({
  body: z.object({
    content: z.string().max(200000),
  }),
  params: z.object({
    roomId: z.string().min(4).max(20),
  }),
  query: z.object({}).optional(),
});

router.use(requireAuth);

router.get('/', validate(roomIdParamSchema), getRoomNote);
router.put('/', validate(updateSchema), updateRoomNote);

export default router;
