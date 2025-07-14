import { motion } from 'framer-motion'
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
    const dispatch = useDispatch<AppDispatch>()

    const [selectedPlayer, setSelectedPlayer] = useState<{
        id: string,
        name: string,
        currentPrice?: number
    } | null>(null);
    const [price, setPrice] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'list' | 'update'>('list');

    useEffect(() => {
        fetchTeamPlayers();
    }, []);

    const handleListClick = (player: { id: string, name: string }) => {
        setSelectedPlayer(player);
        setModalType('list');
        setIsModalOpen(true);
    };

    const handleUpdateClick = (player: { id: string, name: string, transferPrice?: number }) => {
        setSelectedPlayer({
            id: player.id,
            name: player.name,
            currentPrice: player.transferPrice
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
            fetchTeamPlayers();
        } catch (error) {
            console.error(`Failed to ${modalType === 'list' ? 'list' : 'update'} player:`, error);
        }
    };

    const handleUnlist = async (playerId: string) => {
        try {
            await unlistPlayer(playerId);
            fetchTeamPlayers();
        } catch (error) {
            console.error('Failed to unlist player:', error);

        }
    };

    if (loading) return <div>Loading team data...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className='h-full overflow-y-auto'>
            {/* Modal for listing/updating player */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <motion.div
                        className="bg-[#1a1a1a] p-6 rounded-2xl w-full max-w-md"
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                    >
                        <h3 className="text-xl font-bold text-white mb-4">
                            {modalType === 'list'
                                ? `List ${selectedPlayer?.name} for Transfer`
                                : `Update Price for ${selectedPlayer?.name}`}
                        </h3>
                        <div className="mb-4">
                            <label className="block text-white mb-2">Asking Price ($)</label>
                            <input
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className="w-full p-2 rounded bg-gray-800 text-white"
                                placeholder="Enter price"
                                min="1"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setPrice('');
                                }}
                                className="px-4 py-2 rounded cursor-pointer bg-gray-600 text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmAction}
                                className="px-4 py-2 rounded bg-[#83d007] text-black  cursor-pointer font-semibold"
                                disabled={!price}
                            >
                                {modalType === 'list' ? 'List Player' : 'Update Price'}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Player Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
                {teamData?.players.map((player, index) => (
                    <motion.div
                        key={index}
                        className='bg-black/60 backdrop-blur-sm flex flex-col justify-center items-center h-[25rem] rounded-4xl shadow-md'
                        whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                    >
                        <div className='h-40 mt-4 rounded mb-14 flex items-center justify-center'>
                            <FaUser color='white' size={55}/>
                        </div>
                        <h3 className='font-bold text-[#83d007] text-2xl'>{player.name}</h3>
                        <p className='text-sm text-white font-semibold'>{player.position}</p>

                        {player.isOnTransferList ? (
                            <div className="flex flex-col items-center gap-2 mt-3">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            handleUpdateClick(player)
                                            dispatch(invalidateTeamCache())
                                        }}
                                        className="bg-[#83d007] rounded-xl cursor-pointer p-2 text-sm font-semibold text-black"
                                    >
                                        Update Price
                                    </button>
                                    <button
                                        onClick={() => {
                                            handleUnlist(player.id)
                                            dispatch(invalidateTeamCache())
                                        }}
                                        className="bg-[#f12274] rounded-xl cursor-pointer p-2 text-sm font-semibold"
                                    >
                                        Unlist Player
                                    </button>
                                </div>
                                {player.transferPrice && (
                                    <p className="text-white mt-1">
                                        Current Price: ${player.transferPrice.toLocaleString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <button
                                onClick={() => {
                                    handleListClick(player)
                                    dispatch(invalidateTeamCache())
                                }}
                                className="bg-[#f12274] mt-3 rounded-xl cursor-pointer p-2 text-sm font-semibold"
                            >
                                List Player
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    )
}

export default TeamPlayers