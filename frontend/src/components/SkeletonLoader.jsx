import React from 'react';
import { motion } from 'framer-motion';

// Base shimmer animation styles (inline for portability)
const shimmerStyle = {
    background: 'linear-gradient(90deg, transparent 0%, rgba(99,102,241,0.08) 50%, transparent 100%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s ease-in-out infinite',
};

const Bone = ({ className = '', style = {} }) => (
    <div
        className={`bg-gray-200/70 dark:bg-gray-700/70 rounded-xl ${className}`}
        style={{ ...shimmerStyle, ...style }}
    />
);

// ─── Dashboard Skeleton ──────────────────────────────────────────────
export const DashboardSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                <div>
                    <Bone className="h-4 w-40 mb-3" />
                    <Bone className="h-10 w-80 mb-2" />
                    <Bone className="h-4 w-56" />
                </div>
                <div className="flex items-center gap-3">
                    <Bone className="h-12 w-32 rounded-2xl" />
                    <Bone className="h-12 w-36 rounded-2xl" />
                </div>
            </div>

            {/* Stats Cards Skeleton */}
            <div className="mb-10">
                <Bone className="h-8 w-48 mb-6" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Bone className="w-12 h-12 rounded-xl" />
                                <Bone className="h-4 w-20" />
                            </div>
                            <Bone className="h-8 w-16 mb-2" />
                            <Bone className="h-3 w-24" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Quick Access Grid Skeleton */}
            <div className="mb-12">
                <Bone className="h-8 w-40 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 + i * 0.1 }}
                            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50"
                        >
                            <Bone className="w-14 h-14 rounded-xl mb-4" />
                            <Bone className="h-5 w-32 mb-2" />
                            <Bone className="h-3 w-full mb-1" />
                            <Bone className="h-3 w-3/4 mb-4" />
                            <Bone className="h-4 w-24" />
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Activity / Team Split Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <Bone className="h-8 w-48" />
                    <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex items-start gap-4 pb-4 mb-4 border-b border-gray-100 dark:border-gray-700/50 last:border-0 last:mb-0">
                                <Bone className="w-10 h-10 rounded-xl flex-shrink-0" />
                                <div className="flex-1">
                                    <Bone className="h-4 w-3/4 mb-2" />
                                    <Bone className="h-3 w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <div>
                    <Bone className="h-8 w-32 mb-6" />
                    <Bone className="h-72 w-full rounded-3xl" />
                </div>
            </div>
        </div>

        <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `}</style>
    </div>
);

// ─── Card List Skeleton (for Notifications, Passwords, etc.) ─────────
export const CardListSkeleton = ({ count = 5, className = '' }) => (
    <div className={`space-y-4 ${className}`}>
        {[...Array(count)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50"
            >
                <div className="flex items-start gap-4">
                    <Bone className="w-12 h-12 rounded-2xl flex-shrink-0" />
                    <div className="flex-1">
                        <Bone className="h-4 w-3/5 mb-2" />
                        <Bone className="h-3 w-full mb-2" />
                        <Bone className="h-3 w-1/3" />
                    </div>
                </div>
            </motion.div>
        ))}
        <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `}</style>
    </div>
);

// ─── Password Grid Skeleton ─────────────────────────────────────────
export const PasswordGridSkeleton = () => (
    <div className="space-y-10">
        {[...Array(2)].map((_, catIdx) => (
            <div key={catIdx}>
                <div className="flex items-center gap-3 mb-6">
                    <Bone className="w-12 h-12 rounded-xl" />
                    <Bone className="h-6 w-40" />
                    <Bone className="h-6 w-8 rounded-full" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: catIdx * 0.2 + i * 0.08 }}
                            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <Bone className="w-10 h-10 rounded-xl" />
                                <div className="flex-1">
                                    <Bone className="h-4 w-3/4 mb-1" />
                                    <Bone className="h-3 w-1/2" />
                                </div>
                            </div>
                            <Bone className="h-10 w-full rounded-xl mb-3" />
                            <div className="flex gap-2">
                                <Bone className="h-8 w-20 rounded-lg" />
                                <Bone className="h-8 w-20 rounded-lg" />
                                <Bone className="h-8 flex-1 rounded-lg" />
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        ))}
        <style>{`
            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }
        `}</style>
    </div>
);

// ─── Generic Page Loader (replaces the old spinner) ──────────────────
const PageLoader = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30 flex items-center justify-center">
        <div className="text-center">
            <div className="relative w-16 h-16 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full" />
                <div className="absolute inset-0 border-4 border-transparent border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading...</p>
        </div>
    </div>
);

export default PageLoader;
