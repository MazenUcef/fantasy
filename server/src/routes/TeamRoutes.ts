
import express from 'express';
import { authenticateToken } from '../middleware/AuthMiddleWare';
import { updateTeamName } from '../controllers/TeamController';



const router = express.Router();

router.post('/updateTeamName', authenticateToken, updateTeamName);

export default router;