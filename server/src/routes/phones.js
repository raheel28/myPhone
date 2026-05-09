// server/src/routes/phones.js
import { Router } from 'express';
import {
  listPhones,
  featuredPhones,
  listBrands,
  getPhone,
} from '../controllers/phoneController.js';

const router = Router();

router.get('/featured', featuredPhones);
router.get('/brands', listBrands);
router.get('/:slug', getPhone);
router.get('/', listPhones);

export default router;
