
import express from 'express';
import { refreshToken, SignOut, unifiedAuth } from '../controllers/AuthController';
import { authenticateToken } from '../middleware/AuthMiddleWare';
import { validateSignup } from '../middleware/validation';


const router = express.Router();

router.post('/unifiedAuth', validateSignup, unifiedAuth);
router.post('/refresh', refreshToken);
router.post("/signout", authenticateToken, SignOut)

export default router;