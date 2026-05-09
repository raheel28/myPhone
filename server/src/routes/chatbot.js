// server/src/routes/chatbot.js
import { Router } from 'express';
import { chat } from '../controllers/chatbotController.js';

const router = Router();
router.post('/message', chat);
export default router;
