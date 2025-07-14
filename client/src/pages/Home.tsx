import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import background from '../assets/images/background.png';
import TeamPlayers from './TeamPlayers';
import TransferListPage from './TransferListPage';
import { useSignOut } from '../api/AuthApi';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '../store';
import { useTeamNameUpdate } from '../api/TeamApi';
import toast from 'react-hot-toast';
import { LogoutIcon } from '../assets/icons/LogoutIcon';
import { TransferIcon } from '../assets/icons/TransferIcon';
import { TeamIcon } from '../assets/icons/TeamIcon';
import { invalidateTeamCache } from '../redux/teamSlice';

const DEFAULT_TEAM_NAME = 'My Team';

const Home = () => {
    const [activeTab, setActiveTab] = useState<'myTeam' | 'transferList'>('myTeam');
    const { data: teamData } = useSelector((state: RootState) => state.team);
    const { signOut } = useSignOut();
    const { updateTeamName, updating } = useTeamNameUpdate();
    const dispatch = useDispatch<AppDispatch>();
    const [showNameModal, setShowNameModal] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');

    const tabs = [
        { id: 'myTeam', label: 'My Team Players' },
        { id: 'transferList', label: 'Transfer List' },
    ] as const;

    useEffect(() => {
        if (teamData?.teamName === DEFAULT_TEAM_NAME) {
            setShowNameModal(true);
        }
    }, [teamData]);

    const handleNameSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            try {
                await updateTeamName(newTeamName);
                setShowNameModal(false);
                toast.success('Team name updated successfully!');
            } catch (error) {
                toast.error(typeof error === 'string' ? error : 'Failed to update team name');
            }
        },
        [newTeamName, updateTeamName]
    );

    const handleTabChange = useCallback(
        (tabId: 'myTeam' | 'transferList') => {
            if (!showNameModal) {
                setActiveTab(tabId);
            }
        },
        [showNameModal]
    );

    const handleLogout = useCallback(async () => {
        await dispatch(invalidateTeamCache());
        if (!showNameModal) {
            signOut();
        }
    }, [showNameModal, signOut, dispatch]);

    return (
        <div className="flex flex-col w-full min-h-screen bg-gray-900">
            {/* Team Name Modal */}
            <AnimatePresence>
                {showNameModal && (
                    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                        <motion.div
                            className="bg-[#1a1a1a] p-4 sm:p-6 rounded-2xl w-full max-w-md border border-[#83d007]/30"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ type: 'spring', damping: 20 }}
                        >
                            <h3 className="text-lg sm:text-xl font-bold text-white mb-4">
                                Choose Your Team Name
                            </h3>
                            <p className="text-gray-300 text-sm sm:text-base mb-4 sm:mb-6">
                                Your team currently has the default name. Please choose a unique name for your team.
                            </p>
                            <form onSubmit={handleNameSubmit}>
                                <div className="mb-4 sm:mb-6">
                                    <input
                                        type="text"
                                        value={newTeamName}
                                        onChange={(e) => setNewTeamName(e.target.value)}
                                        className="w-full p-2 sm:p-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-[#83d007] focus:ring-2 focus:ring-[#83d007]/50 transition text-sm sm:text-base"
                                        placeholder="Enter team name"
                                        minLength={3}
                                        maxLength={30}
                                        required
                                        autoFocus
                                    />
                                    <div className="flex justify-between text-xs sm:text-sm text-gray-400 mt-2">
                                        <span>3-30 characters</span>
                                        <span>{newTeamName.length}/30</span>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        type="submit"
                                        className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg bg-[#83d007] hover:bg-[#72b806] text-black font-semibold disabled:opacity-50 transition text-sm sm:text-base"
                                        disabled={updating || !newTeamName || newTeamName.trim() === DEFAULT_TEAM_NAME}
                                    >
                                        {updating ? (
                                            <span className="flex items-center gap-2">
                                                <span className="inline-block h-3 w-3 sm:h-4 sm:w-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></span>
                                                Saving...
                                            </span>
                                        ) : (
                                            'Save Team Name'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Main Layout */}
            <div className="flex flex-col md:flex-row w-full min-h-screen gap-4 sm:gap-6">
                {/* Sidebar */}
                <motion.div
                    className="w-full md:w-64 lg:w-80 bg-[#ecf5b7] p-4 sm:p-6 flex-shrink-0 md:sticky md:top-0 md:h-screen md:overflow-y-auto"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="w-full h-full bg-[#83d007] rounded-xl p-4 sm:p-6 flex flex-col">
                        <div className="text-center mb-4 sm:mb-6">
                            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                                Football Manager
                            </h1>
                            <h2
                                className="text-lg sm:text-xl font-bold text-white truncate"
                                title={teamData?.teamName}
                            >
                                {teamData?.teamName}
                            </h2>
                            <p className="text-sm sm:text-lg text-white mt-2 sm:mt-3">
                                Budget: <span className="font-bold">${teamData?.budget?.toLocaleString()}</span>
                            </p>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-col gap-2 sm:gap-3 flex-grow mb-4 sm:mb-6">
                            {tabs.map((tab) => (
                                <motion.button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`relative px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-left font-medium text-sm sm:text-base ${activeTab === tab.id ? 'text-white' : 'text-white/80 hover:text-white'
                                        }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={showNameModal}
                                >
                                    {activeTab === tab.id && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute inset-0 bg-[#5a9e03] rounded-lg shadow-sm"
                                            initial={false}
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                    <span className="relative z-10 flex items-center gap-2 sm:gap-3">
                                        {tab.id === 'myTeam' ? <TeamIcon /> : <TransferIcon />}
                                        {tab.label}
                                    </span>
                                </motion.button>
                            ))}
                        </div>

                        {/* Logout Button */}
                        <motion.button
                            onClick={handleLogout}
                            className={`mt-auto py-2 sm:py-3 px-3 sm:px-4 rounded-lg font-medium relative overflow-hidden text-sm sm:text-base group ${showNameModal ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#5a9e03]'
                                }`}
                            disabled={showNameModal}
                            whileHover={!showNameModal ? { scale: 1.02 } : {}}
                        >
                            <span className="flex items-center justify-center gap-2 sm:gap-3 text-white">
                                <LogoutIcon />
                                Logout
                            </span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Main Content */}
                <motion.div
                    style={{
                        backgroundImage: `url(${background})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundAttachment: 'fixed',
                    }}
                    className="flex-grow rounded-2xl p-4 sm:p-6 md:p-8 relative overflow-auto min-h-screen"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    {showNameModal && (
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm rounded-2xl z-10" />
                    )}

                    <AnimatePresence mode="wait">
                        {!showNameModal && (
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ duration: 0.3 }}
                                className="h-full"
                            >
                                {activeTab === 'myTeam' && <TeamPlayers />}
                                {activeTab === 'transferList' && <TransferListPage />}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default Home;