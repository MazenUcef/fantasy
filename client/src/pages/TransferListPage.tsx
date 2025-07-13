import { motion } from 'framer-motion';
import { useEffect, useState, useCallback } from 'react';
import { usePlayerPurchase, useTransferList } from '../api/TransferApi';
import { useTeamPlayers } from '../api/TeamApi';
import { debounce } from 'lodash';
import toast from 'react-hot-toast';
import { invalidateTeamCache } from '../redux/teamSlice';
import type { AppDispatch } from '../store';
import { useDispatch } from 'react-redux';
import { FaUser } from 'react-icons/fa';

const TransferListPage = () => {
    const {
        transferList: filteredPlayers,
        loading,
        error,
        fetchTransferList
    } = useTransferList();
    const { buyPlayer } = usePlayerPurchase();
    const dispatch = useDispatch<AppDispatch>();
    const { fetchTeamPlayers } = useTeamPlayers();
    const [filters, setFilters] = useState({
        position: '',
        minPrice: '',
        maxPrice: '',
        search: '',
        teamName: ''
    });


    const debouncedFetch = useCallback(
        debounce((filters: any) => {
            fetchTransferList({
                position: filters.position,
                minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
                search: filters.search,
                teamName: filters.teamName
            });
        }, 500),
        []
    );


    useEffect(() => {
        fetchTransferList();
    }, []);


    useEffect(() => {
        debouncedFetch(filters);
        return () => debouncedFetch.cancel();
    }, [filters, debouncedFetch]);

    const handleFilterChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            position: '',
            minPrice: '',
            maxPrice: '',
            search: '',
            teamName: ''
        });
    };

    const handleBuyPlayer = async (playerId: string) => {
        try {
            await buyPlayer(playerId);


            await dispatch(invalidateTeamCache())
            await Promise.all([
                fetchTransferList(),
                fetchTeamPlayers()
            ]);
        } catch (error) {
            toast.error(typeof error === 'string' ? error : 'Failed to buy player');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#83d007]"></div>
        </div>
    );

    if (error) return (
        <div className="flex justify-center items-center h-full text-red-500">
            <p>Error: {error}</p>
        </div>
    );

    return (
        <div className='h-full overflow-y-auto p-4'>
            {/* Filter Controls */}
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="space-y-2">
                    <label className="block text-white font-medium">Search Players</label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-1 focus:ring-[#83d007] transition"
                        placeholder="Player name..."
                    />
                </div>

                {/* Position Filter */}
                <div className="space-y-2">
                    <label className="block text-white font-medium">Position</label>
                    <select
                        value={filters.position}
                        onChange={(e) => handleFilterChange('position', e.target.value)}
                        className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-1 focus:ring-[#83d007] transition"
                    >
                        <option value="">All Positions</option>
                        <option value="Forward">Forward</option>
                        <option value="Midfielder">Midfielder</option>
                        <option value="Defender">Defender</option>
                        <option value="Goalkeeper">Goalkeeper</option>
                    </select>
                </div>

                {/* Price Range */}
                <div className="space-y-2">
                    <label className="block text-white font-medium">Price Range</label>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="number"
                            value={filters.minPrice}
                            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-1 focus:ring-[#83d007] transition"
                            placeholder="Min"
                            min="0"
                        />
                        <input
                            type="number"
                            value={filters.maxPrice}
                            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            className="w-full p-2 rounded bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-1 focus:ring-[#83d007] transition"
                            placeholder="Max"
                            min="0"
                        />
                    </div>
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                    <button
                        onClick={handleResetFilters}
                        className="w-full md:w-auto px-4 py-2 rounded bg-[#f12274] hover:bg-[#e01a6a] text-white font-semibold transition"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Player Grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
                {filteredPlayers.map((player) => (
                    <motion.div
                        key={player.id}
                        className='bg-black/60 backdrop-blur-sm flex flex-col items-center p-6 rounded-2xl shadow-lg border border-gray-800 hover:border-[#83d007] transition'
                        whileHover={{ y: -5 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className='h-40 w-40 rounded-full bg-gray-800/50 mb-4 flex items-center justify-center'>
                            <FaUser size={25}/>
                        </div>
                        <h3 className='font-bold text-[#83d007] text-xl text-center'>{player.name}</h3>
                        <p className='text-sm text-white font-semibold'>{player.position}</p>
                        <p className="text-gray-300 mt-2 text-sm">Team: {player.teamName}</p>
                        <p className="text-white mt-1 font-medium">
                            ${player.transferPrice?.toLocaleString()}
                        </p>
                        {!player.isOwnPlayer && (
                            <button
                                className="bg-[#83d007] hover:bg-[#72b806] mt-4 rounded-full px-6 py-2 text-sm font-semibold text-black transition"
                                onClick={() => handleBuyPlayer(player.id)}
                            >
                                Buy Player
                            </button>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Empty State */}
            {filteredPlayers.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-64">
                    <h3 className="text-xl text-white mb-2">No players found</h3>
                    <p className="text-gray-400 mb-4">Try adjusting your filters</p>
                    <button
                        onClick={handleResetFilters}
                        className="px-4 py-2 rounded bg-[#83d007] hover:bg-[#72b806] text-black font-semibold transition"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default TransferListPage;