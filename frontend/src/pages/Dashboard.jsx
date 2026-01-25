import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { Users, Clock, Zap, Video, Plus, Calendar, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { APP_FEATURES } from '../constants';
import { motion } from 'framer-motion';

const Dashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        const headers = { 'Authorization': `Bearer ${user.token}` };

        // Fetch Teams
        const teamRes = await fetch('/api/team', { headers });
        const teams = await teamRes.json();

        if (!teamRes.ok) throw new Error('Failed to fetch teams');

        let dashboardData = { teamMembers: [], activities: [] };

        if (teams.length > 0) {
            const primaryTeam = teams[0];
            dashboardData.teamMembers = primaryTeam.members || [];

            // Fetch Activities
            const activityRes = await fetch(`/api/team/activity/${primaryTeam.id}`, { headers });
            const activityData = await activityRes.json();

            if (activityRes.ok) {
                dashboardData.activities = activityData;
            }
        }
        return dashboardData;
    };

    const { data: dashboardData, isLoading } = useQuery({
        queryKey: ['dashboardData'],
        queryFn: fetchDashboardData,
        staleTime: 60000
    });

    const activities = dashboardData?.activities || [];
    const teamMembers = dashboardData?.teamMembers || [];

    const features = APP_FEATURES;
    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 /30 dark: from - gray - 900 dark: via - gray - 900 dark: to - indigo - 950 / 30">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
                <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-gradient-to-br from-pink-500/15 to-purple-500/15 rounded-full blur-[100px] animate-blob animation-delay-4000" />
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Welcome Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4"
                >
                    <div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-2">
                            <Calendar size={16} className="text-indigo-500" />
                            {today}
                        </p>
                        <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-2">
                            Welcome back, <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent">{user.name.split(' ')[0]}</span>
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 font-medium flex items-center gap-2">
                            <Sparkles size={16} className="text-yellow-500" />
                            Ready to make today productive?
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/kanban', { state: { openNewTask: true } })}
                            className="flex items-center gap-2 px-5 py-3 bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl border border-gray-200/50 dark:border-gray-700/50 rounded-2xl text-sm font-bold hover:bg-white dark:hover:bg-gray-800 transition-all shadow-lg"
                        >
                            <Plus size={18} strokeWidth={2.5} /> New Task
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/video-call')}
                            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/30"
                        >
                            <Video size={18} strokeWidth={2.5} /> New Meeting
                        </motion.button>
                    </div>
                </motion.div>

                {/* Apps Grid */}
                <div className="mb-12">
                    <motion.h2
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-2xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-2"
                    >
                        <Zap size={24} className="text-indigo-500" /> Quick Access
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                whileHover={{ y: -4 }}
                                onClick={() => navigate(feature.path)}
                                className="cursor-pointer group"
                            >
                                <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 transition-all duration-300 hover:shadow-xl hover:border-indigo-400/50 dark:hover:border-indigo-500/50">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.iconBg} flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                        <feature.icon size={24} strokeWidth={2} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 font-medium">{feature.description}</p>
                                    <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-bold group-hover:translate-x-1 transition-transform">
                                        {feature.stats} <ArrowRight size={16} className="ml-1" />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity / Overview Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Activity Feed */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
                                <TrendingUp size={24} className="text-indigo-500" />
                                Recent Activity
                            </h2>
                            <button className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold">View All</button>
                        </div>
                        {activities.length > 0 ? (
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg">
                                <div className="space-y-4">
                                    {activities.map((activity, index) => (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + index * 0.1 }}
                                            className="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0 last:pb-0"
                                        >
                                            <div className="mt-1 w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                                                <Users size={18} />
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-900 dark:text-white font-medium">
                                                    <span className="font-black">Team Admin</span> {activity.text}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{new Date(activity.createdAt).toLocaleDateString()} • {new Date(activity.createdAt).toLocaleTimeString()}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-3xl border border-gray-200/50 dark:border-gray-700/50 p-6 shadow-lg min-h-[300px] flex items-center justify-center text-center">
                                <div className="space-y-4">
                                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center">
                                        <Clock size={32} className="text-indigo-500" />
                                    </div>
                                    <div>
                                        <p className="text-gray-900 dark:text-white font-bold text-lg">All caught up!</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">No new notifications.</p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>

                    {/* Right: Team Snapshot */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-6"
                    >
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white">My Team</h2>
                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="p-4 bg-white/20 backdrop-blur-md rounded-2xl shadow-lg">
                                        <Users size={28} strokeWidth={2} />
                                    </div>
                                    <span className="text-xs font-black bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-xl uppercase tracking-wider shadow-md">Active</span>
                                </div>
                                <h3 className="text-4xl font-black mb-2">{user.role === 'admin' ? 'Admin Access' : 'Member'}</h3>
                                <p className="text-indigo-100 text-sm mb-8 font-medium">Manage your workspace collaboration.</p>

                                {user.role === 'admin' && (
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => navigate('/team-management')}
                                        className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all shadow-xl"
                                    >
                                        Manage Team
                                    </motion.button>
                                )}
                                {user.role !== 'admin' && (
                                    <div className="flex -space-x-3 mt-2">
                                        {teamMembers.length > 0 ? teamMembers.slice(0, 5).map(m => (
                                            <div key={m._id} className="w-12 h-12 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur-md flex items-center justify-center text-sm font-bold shadow-lg" title={m.name}>
                                                {m.name.charAt(0)}
                                            </div>
                                        )) : (
                                            <p className="text-sm opacity-80">No team members</p>
                                        )}
                                        {teamMembers.length > 5 && (
                                            <div className="w-12 h-12 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur-md flex items-center justify-center text-sm font-bold shadow-lg">
                                                +{teamMembers.length - 5}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {/* Decorative Elements */}
                            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2"></div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
