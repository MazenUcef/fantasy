import express from 'express';
import { authenticateToken } from '../middleware/AuthMiddleWare';
import { buyPlayer, getMyTeamPlayers, getMyTeamPlayersForSale, getTransferList, listPlayer, unlistPlayer, updateAskingPrice } from '../controllers/TransferController';

const router = express.Router();

router.get('/getTransferList', authenticateToken, getTransferList);
router.post('/list', authenticateToken, listPlayer);
router.post('/unlist', authenticateToken, unlistPlayer);
router.post('/buy', authenticateToken, buyPlayer);
router.put('/price', authenticateToken, updateAskingPrice);
router.get('/getMyTeamPlayers', authenticateToken, getMyTeamPlayers);
router.get('/getMyTeamPlayersForSale', authenticateToken, getMyTeamPlayersForSale);

export default router; 