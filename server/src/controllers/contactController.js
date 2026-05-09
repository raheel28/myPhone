// server/src/controllers/contactController.js
import Contact from '../models/Contact.js';
import { asyncHandler } from '../utils/asyncHandler.js';

/** POST /api/contact */
export const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  if (!name || !email || !message) {
    res.status(400);
    throw new Error('name, email and message are required.');
  }
  // Light email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400);
    throw new Error('Invalid email format.');
  }
  const created = await Contact.create({ name, email, phone, subject, message });
  res.status(201).json({ id: created._id, message: 'Thanks — we will be in touch shortly!' });
});
