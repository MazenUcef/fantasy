import express from 'express';
import { authenticateToken } from '../middleware/AuthMiddleWare';
import { buyPlayer, getTransferList, listPlayer, unlistPlayer, updateAskingPrice } from '../controllers/TransferController';

const router = express.Router();

router.get('/getTransferList', authenticateToken, getTransferList);
router.post('/list', authenticateToken, listPlayer);
router.post('/unlist', authenticateToken, unlistPlayer);
router.post('/buy', authenticateToken, buyPlayer);
router.put('/price', authenticateToken, updateAskingPrice);

export default router; 