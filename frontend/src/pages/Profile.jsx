import React from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Smartphone, Key, Bell, CreditCard, LogOut, Settings, ChevronRight, Camera } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(' ');
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    const sections = [
        {
            title: 'Security & Access',
            icon: Shield,
            color: 'text-indigo-500',
            items: [
                { icon: Key, label: 'Change Password', desc: 'Update your security key', action: 'Update' },
                { icon: Smartphone, label: 'Two-Factor Auth', desc: 'Add an extra layer of security', badge: 'Enabled', badgeColor: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
            ]
        },
        {
            title: 'Preferences',
            icon: Settings,
            color: 'text-purple-500',
            items: [
                { icon: Bell, label: 'Notifications', desc: 'Manage email & push alerts', action: 'Manage' },
                { icon: CreditCard, label: 'Billing & Plans', desc: 'Manage your subscription', action: 'View' }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-[120px] animate-blob" />
                <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
            </div>

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                {/* Header Profile Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-2xl rounded-3xl p-8 shadow-xl border border-gray-200/50 dark:border-gray-700/50 relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-10" />

                    <div className="relative flex flex-col md:flex-row items-center gap-8 text-center md:text-left pt-4">
                        <div className="relative group">
                            <div className="w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-2xl ring-4 ring-white dark:ring-gray-800 relative z-10">
                                {getInitials(user?.name)}
                            </div>
                            <button className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-700 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 text-gray-500 hover:text-indigo-600 transition-colors z-20">
                                <Camera size={18} />
                            </button>
                        </div>

                        <div className="flex-1 space-y-3">
                            <div>
                                <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-1 tracking-tight">{user?.name}</h1>
                                <p className="text-gray-500 dark:text-gray-400 font-medium">Manage your personal details and settings</p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2">
                                <span className="flex items-center gap-2 text-sm bg-gray-100 dark:bg-gray-700/50 px-4 py-2 rounded-xl font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                    <Mail size={16} className="text-indigo-500" /> {user?.email}
                                </span>
                                <span className="flex items-center gap-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 px-4 py-2 rounded-xl font-bold border border-indigo-100 dark:border-indigo-800 capitalize">
                                    <Shield size={16} /> {user?.role || 'Member'}
                                </span>
                            </div>
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="px-6 py-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-xl font-bold hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center gap-2 border border-red-100 dark:border-red-900/20 shadow-sm"
                        >
                            <LogOut size={18} />
                            <span>Sign Out</span>
                        </motion.button>
                    </div>
                </motion.div>

                {/* Settings Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {sections.map((section, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 + idx * 0.1 }}
                            className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg"
                        >
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl bg-gray-50 dark:bg-gray-700/50 ${section.color}`}>
                                    <section.icon size={22} />
                                </div>
                                {section.title}
                            </h3>

                            <div className="space-y-3">
                                {section.items.map((item, i) => (
                                    <motion.button
                                        key={i}
                                        whileHover={{ x: 4, backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                                        className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-700/20 rounded-2xl border border-gray-100 dark:border-gray-700/50 hover:border-gray-200 dark:hover:border-gray-600 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl text-gray-400 shadow-sm group-hover:text-indigo-500 transition-colors">
                                                <item.icon size={20} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{item.label}</p>
                                                <p className="text-xs text-gray-500">{item.desc}</p>
                                            </div>
                                        </div>

                                        {item.badge ? (
                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${item.badgeColor}`}>
                                                {item.badge}
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs font-bold text-gray-400 group-hover:text-indigo-600 transition-colors">
                                                <span>{item.action}</span>
                                                <ChevronRight size={14} />
                                            </div>
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Profile;
