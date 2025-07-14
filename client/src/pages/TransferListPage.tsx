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
        fetchTransferList,
    } = useTransferList();
    const { buyPlayer } = usePlayerPurchase();
    const dispatch = useDispatch<AppDispatch>();
    const { fetchTeamPlayers } = useTeamPlayers();
    const [filters, setFilters] = useState({
        position: '',
        minPrice: '',
        maxPrice: '',
        search: '',
        teamName: '',
    });

    const debouncedFetch = useCallback(
        debounce((filters: any) => {
            fetchTransferList({
                position: filters.position,
                minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
                maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
                search: filters.search,
                teamName: filters.teamName,
            });
        }, 500),
        [fetchTransferList]
    );

    useEffect(() => {
        fetchTransferList();
    }, [fetchTransferList]);

    useEffect(() => {
        debouncedFetch(filters);
        return () => debouncedFetch.cancel();
    }, [filters, debouncedFetch]);

    const handleFilterChange = (name: string, value: string) => {
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    const handleResetFilters = () => {
        setFilters({
            position: '',
            minPrice: '',
            maxPrice: '',
            search: '',
            teamName: '',
        });
    };

    const handleBuyPlayer = async (playerId: string) => {
        try {
            await buyPlayer(playerId);
            await dispatch(invalidateTeamCache());
            await Promise.all([fetchTransferList(), fetchTeamPlayers()]);
            toast.success('Player purchased successfully!');
        } catch (error) {
            toast.error(typeof error === 'string' ? error : 'Failed to buy player');
        }
    };

    if (loading)
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-t-2 border-b-2 border-[#83d007]"></div>
            </div>
        );

    if (error)
        return (
            <div className="flex justify-center items-center h-full text-red-400 text-sm sm:text-base">
                <p>Error: {error}</p>
            </div>
        );

    return (
        <div className="h-full overflow-y-auto p-2 sm:p-4">
            {/* Filter Controls */}
            <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Search Input */}
                <div className="space-y-2">
                    <label className="block text-white text-sm sm:text-base font-medium">Search Players</label>
                    <input
                        type="text"
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                        className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-2 focus:ring-[#83d007]/50 transition text-sm sm:text-base"
                        placeholder="Player name..."
                    />
                </div>

                {/* Position Filter */}
                <div className="space-y-2">
                    <label className="block text-white text-sm sm:text-base font-medium">Position</label>
                    <select
                        value={filters.position}
                        onChange={(e) => handleFilterChange('position', e.target.value)}
                        className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-2 focus:ring-[#83d007]/50 transition text-sm sm:text-base"
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
                    <label className="block text-white text-sm sm:text-base font-medium">Price Range</label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                        <input
                            type="number"
                            value={filters.minPrice}
                            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                            className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-2 focus:ring-[#83d007]/50 transition text-sm sm:text-base"
                            placeholder="Min"
                            min="0"
                        />
                        <input
                            type="number"
                            value={filters.maxPrice}
                            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                            className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-2 focus:ring-[#83d007]/50 transition text-sm sm:text-base"
                            placeholder="Max"
                            min="0"
                        />
                    </div>
                </div>

                {/* Team Name Filter */}
                <div className="space-y-2">
                    <label className="block text-white text-sm sm:text-base font-medium">Team Name</label>
                    <input
                        type="text"
                        value={filters.teamName}
                        onChange={(e) => handleFilterChange('teamName', e.target.value)}
                        className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-2 focus:ring-[#83d007]/50 transition text-sm sm:text-base"
                        placeholder="Team name..."
                    />
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                    <button
                        onClick={handleResetFilters}
                        className="w-full p-2 sm:p-3 rounded-lg bg-[#f12274] hover:bg-[#d11a5f] text-white font-semibold text-sm sm:text-base transition"
                    >
                        Reset Filters
                    </button>
                </div>
            </div>

            {/* Player Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {filteredPlayers.map((player) => (
                    <motion.div
                        key={player.id}
                        className="bg-black/60 backdrop-blur-sm flex flex-col items-center p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-800 hover:border-[#83d007] transition"
                        whileHover={{ y: -5 }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-gray-800/50 mb-3 sm:mb-4 flex items-center justify-center">
                            <FaUser color="white" size={40} className="sm:w-14 sm:h-14" />
                        </div>
                        <h3 className="font-bold text-[#83d007] text-lg sm:text-xl text-center truncate w-full">
                            {player.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-white font-semibold">{player.position}</p>
                        <p className="text-gray-300 text-xs sm:text-sm mt-1 sm:mt-2 truncate w-full text-center">
                            Team: {player.teamName}
                        </p>
                        <p className="text-white text-xs sm:text-sm mt-1 font-medium">
                            ${player.transferPrice?.toLocaleString()}
                        </p>
                        {!player.isOwnPlayer && (
                            <button
                                className="bg-[#83d007] hover:bg-[#72b806] mt-2 sm:mt-4 rounded-lg p-2 sm:p-3 text-xs sm:text-sm font-semibold text-black transition w-full"
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
                <div className="flex flex-col items-center justify-center h-64 sm:h-80 text-center">
                    <h3 className="text-lg sm:text-xl text-white mb-2">No players found</h3>
                    <p className="text-gray-400 text-sm sm:text-base mb-3 sm:mb-4">
                        Try adjusting your filters
                    </p>
                    <button
                        onClick={handleResetFilters}
                        className="p-2 sm:p-3 rounded-lg bg-[#83d007] hover:bg-[#72b806] text-black font-semibold text-sm sm:text-base transition"
                    >
                        Reset Filters
                    </button>
                </div>
            )}
        </div>
    );
};

export default TransferListPage;