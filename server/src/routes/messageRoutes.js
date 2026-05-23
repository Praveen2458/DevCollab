import express from 'express';
import { z } from 'zod';
import { listRoomMessages } from '../controllers/messageController.js';
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

router.use(requireAuth);
router.get('/', validate(roomIdParamSchema), listRoomMessages);

export default router;
