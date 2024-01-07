import express from 'express';
import { GetAllAreas, GetAreaByID } from '../methods/PublicMethod.js';
const router = express.Router();

router.get('/areas', GetAllAreas);
router.get('/area/:id', GetAreaByID);

export default router;