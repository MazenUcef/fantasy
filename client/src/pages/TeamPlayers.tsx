import { motion } from 'framer-motion';
import { useTeamPlayers } from '../api/TeamApi';
import { useEffect, useState } from 'react';
import { usePlayerListing, usePriceUpdate } from '../api/TransferApi';
import { invalidateTeamCache } from '../redux/teamSlice';
import { useDispatch } from 'react-redux';
import type { AppDispatch } from '../store';
import { FaUser } from 'react-icons/fa';

const TeamPlayers = () => {
    const { teamData, loading, error, fetchTeamPlayers } = useTeamPlayers();
    const { listPlayer, unlistPlayer } = usePlayerListing();
    const { updatePrice } = usePriceUpdate();
    const dispatch = useDispatch<AppDispatch>();

    const [selectedPlayer, setSelectedPlayer] = useState<{
        id: string;
        name: string;
        currentPrice?: number;
    } | null>(null);
    const [price, setPrice] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'list' | 'update'>('list');

    useEffect(() => {
        fetchTeamPlayers();
    }, [fetchTeamPlayers]);

    const handleListClick = (player: { id: string; name: string }) => {
        setSelectedPlayer(player);
        setModalType('list');
        setPrice('');
        setIsModalOpen(true);
    };

    const handleUpdateClick = (player: { id: string; name: string; transferPrice?: number }) => {
        setSelectedPlayer({
            id: player.id,
            name: player.name,
            currentPrice: player.transferPrice,
        });
        setPrice(player.transferPrice?.toString() || '');
        setModalType('update');
        setIsModalOpen(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedPlayer || !price) return;

        try {
            if (modalType === 'list') {
                await listPlayer(selectedPlayer.id, Number(price));
            } else {
                await updatePrice(selectedPlayer.id, Number(price));
            }
            setIsModalOpen(false);
            setPrice('');
            dispatch(invalidateTeamCache());
            fetchTeamPlayers();
        } catch (error) {
            console.error(`Failed to ${modalType === 'list' ? 'list' : 'update'} player:`, error);
        }
    };

    const handleUnlist = async (playerId: string) => {
        try {
            await unlistPlayer(playerId);
            dispatch(invalidateTeamCache());
            fetchTeamPlayers();
        } catch (error) {
            console.error('Failed to unlist player:', error);
        }
    };

    if (loading) return <div className="text-white text-center text-sm sm:text-base">Loading team data...</div>;
    if (error) return <div className="text-red-400 text-center text-sm sm:text-base">Error: {error}</div>;

    return (
        <div className="h-full overflow-y-auto p-2 sm:p-4">
            {/* Modal for listing/updating player */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 sm:p-6">
                    <motion.div
                        className="bg-[#1a1a1a] p-4 sm:p-6 rounded-2xl w-full max-w-sm sm:max-w-md border border-[#83d007]/30"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 20 }}
                    >
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-4 truncate">
                            {modalType === 'list'
                                ? `List ${selectedPlayer?.name} for Transfer`
                                : `Update Price for ${selectedPlayer?.name}`}
                        </h3>
                        <div className="mb-4 sm:mb-6">
                            <label className="block text-white text-sm sm:text-base mb-2">Asking Price ($)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-2 focus:ring-[#83d007]/50 transition text-sm sm:text-base"
                                placeholder="Enter price"
                                min="1"
                                autoFocus
                            />
                        </div>
                        <div className="flex justify-end gap-2 sm:gap-3">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setPrice('');
                                }}
                                className="px-3 sm:px-4 py-2 rounded-lg bg-gray-600 text-white text-sm sm:text-base hover:bg-gray-700 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className="px-3 sm:px-4 py-2 rounded-lg bg-[#83d007] text-black font-semibold text-sm sm:text-base hover:bg-[#72b806] transition disabled:opacity-50"
                                disabled={!price}
                            >
                                {modalType === 'list' ? 'List Player' : 'Update Price'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Player Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {teamData?.players.map((player, index) => (
                    <motion.div
                        key={index}
                        className="bg-black/60 backdrop-blur-sm flex flex-col justify-between items-center rounded-2xl shadow-md p-4 sm:p-6 h-80 sm:h-96"
                        whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}
                        transition={{ type: 'spring', stiffness: 300 }}
                    >
                        <div className="h-24 sm:h-32 mt-4 rounded-full flex items-center justify-center">
                            <FaUser color="white" size={40} className="sm:w-14 sm:h-14" />
                        </div>
                        <h3 className="font-bold text-[#83d007] text-lg sm:text-xl mt-2 sm:mt-4 truncate w-full text-center">
                            {player.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-white font-semibold">{player.position}</p>

                        {player.isOnTransferList ? (
                            <div className="flex flex-col items-center gap-2 sm:gap-3 mt-2 sm:mt-3 w-full">
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full justify-center">
                                    <button
                                        onClick={() => handleUpdateClick(player)}
                                        className="bg-[#83d007] rounded-lg p-2 sm:p-3 text-xs sm:text-sm font-semibold text-black hover:bg-[#72b806] transition flex-1"
                                    >
                                        Update Price
                                    </button>
                                    <button
                                        onClick={() => handleUnlist(player.id)}
                                        className="bg-[#f12274] rounded-lg p-2 sm:p-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#d11a5f] transition flex-1"
                                    >
                                        Unlist Player
                                    </button>
                                </div>
                                {player.transferPrice && (
                                    <p className="text-white text-xs sm:text-sm mt-1">
                                        Price: ${player.transferPrice.toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => handleListClick(player)}
                                className="bg-[#f12274] rounded-lg p-2 sm:p-3 mt-2 sm:mt-3 text-xs sm:text-sm font-semibold text-white hover:bg-[#d11a5f] transition w-full"
                            >
                                List Player
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default TeamPlayers;