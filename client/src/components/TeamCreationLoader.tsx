// src/components/TeamCreationLoader.tsx
import { motion } from 'framer-motion';
import { FaFutbol, FaTrophy, FaUsers, FaChartLine } from 'react-icons/fa';

const TeamCreationLoader = () => {
    const loadingMessages = [
        "Assembling your dream team...",
        "Analyzing player stats...",
        "Optimizing team formation...",
        "Finalizing your squad...",
        "Almost ready to compete..."
    ];

    return (
        <div className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center">
            <motion.div
                className="text-center max-w-md px-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Animated Football */}
                <motion.div
                    animate={{
                        y: [0, -20, 0],
                        rotate: [0, 360, 0]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="text-6xl text-yellow-400 mb-6"
                >
                    <FaFutbol />
                </motion.div>

                {/* Loading Messages */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                >
                    <h2 className="text-2xl font-bold text-white mb-2">Creating Your Team</h2>
                    <motion.p
                        className="text-gray-300"
                        animate={{
                            opacity: [0.6, 1, 0.6],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                        }}
                    >
                        {loadingMessages[Math.floor(Math.random() * loadingMessages.length)]}
                    </motion.p>
                </motion.div>

                {/* Progress Indicators */}
                <div className="flex justify-center gap-4 mb-8">
                    {[FaUsers, FaChartLine, FaTrophy].map((Icon, index) => (
                        <motion.div
                            key={index}
                            className="text-3xl text-gray-400"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.7, 1, 0.7]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                delay: index * 0.3
                            }}
                        >
                            <Icon />
                        </motion.div>
                    ))}
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2.5 mb-4">
                    <motion.div
                        className="bg-gradient-to-r from-yellow-500 to-green-500 h-2.5 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{
                            duration: 5,
                            ease: "easeInOut"
                        }}
                    />
                </div>

                <p className="text-gray-400 text-sm">
                    This may take a few moments. Please don't close this page.
                </p>
            </motion.div>
        </div>
    );
};

export default TeamCreationLoader;