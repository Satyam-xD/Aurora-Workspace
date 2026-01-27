import React, { useState, useEffect } from 'react';
import { useChatContext } from '../context/ChatContext';
import { Video, Phone, Search, Users, Wifi, WifiOff, X } from 'lucide-react';

const VideoCallPage = () => {
    const { startCall, onlineUsers, chats, user } = useChatContext();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);

    // Extract unique users from chats
    useEffect(() => {
        if (chats && chats.length > 0) {
            const users = chats.map(chat => {
                // Get the other participant in the chat
                const otherUser = chat.participants?.find(p => p._id !== user?._id);
                return otherUser;
            }).filter(Boolean);

            // Filter based on search query
            const filtered = users.filter(u =>
                u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );

            setFilteredUsers(filtered);
        }
    }, [chats, searchQuery, user]);

    const isUserOnline = (userId) => {
        return onlineUsers?.some(id => id === userId);
    };

    const handleCallUser = (targetUser) => {
        if (targetUser && targetUser._id) {
            startCall(targetUser._id);
        }
    };

    const UserCard = ({ user: targetUser }) => {
        const online = isUserOnline(targetUser._id);

        return (
            <div
                className="group relative bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 hover:border-aurora-500 dark:hover:border-aurora-500 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] cursor-pointer"
                onClick={() => setSelectedUser(targetUser)}
            >
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-aurora-400 to-aurora-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {targetUser.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        {/* Online indicator */}
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-gray-800 ${online ? 'bg-green-500' : 'bg-gray-400'
                            }`}>
                            {online && (
                                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
                            )}
                        </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                            {targetUser.name || 'Unknown User'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                            {online ? (
                                <>
                                    <Wifi size={14} className="text-green-500" />
                                    <span className="text-green-600 dark:text-green-400">Online</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={14} className="text-gray-400" />
                                    <span>Offline</span>
                                </>
                            )}
                        </p>
                    </div>

                    {/* Call Button */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleCallUser(targetUser);
                        }}
                        disabled={!online}
                        className={`p-3 rounded-full transition-all duration-300 ${online
                                ? 'bg-aurora-600 hover:bg-aurora-700 text-white hover:scale-110 shadow-lg hover:shadow-aurora-500/50'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                        title={online ? 'Start video call' : 'User is offline'}
                    >
                        <Video size={20} />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-aurora-50/20 to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-aurora-500 to-aurora-700 rounded-3xl mb-6 shadow-2xl shadow-aurora-500/30 animate-float">
                        <Video size={40} className="text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3 bg-gradient-to-r from-aurora-600 to-aurora-800 bg-clip-text text-transparent">
                        Video Calls
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 text-lg">
                        Connect face-to-face with your team members
                    </p>
                </div>

                {/* Search Bar */}
                <div className="mb-6 relative animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-aurora-500 focus:ring-4 focus:ring-aurora-500/20 transition-all outline-none text-lg"
                        />
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                                <Wifi className="text-green-600 dark:text-green-400" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {onlineUsers?.length || 0}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Online Now</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-aurora-100 dark:bg-aurora-900/30 rounded-xl flex items-center justify-center">
                                <Users className="text-aurora-600 dark:text-aurora-400" size={24} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {filteredUsers.length}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Contacts</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users List */}
                <div className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map((targetUser, index) => (
                            <div
                                key={targetUser._id}
                                className="animate-slide-up"
                                style={{ animationDelay: `${0.4 + index * 0.05}s` }}
                            >
                                <UserCard user={targetUser} />
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Users size={40} className="text-gray-400" />
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                No contacts found
                            </h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                {searchQuery ? 'Try a different search term' : 'Start a chat to add contacts'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Info Footer */}
                <div className="mt-8 p-6 bg-aurora-50 dark:bg-aurora-900/10 rounded-2xl border border-aurora-200 dark:border-aurora-800 animate-slide-up" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-aurora-100 dark:bg-aurora-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Phone className="text-aurora-600" size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                                Peer-to-Peer Video Calls
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                All calls are encrypted and established directly between users for maximum privacy and quality.
                                Make sure you have a stable internet connection for the best experience.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }
                .animate-slide-up {
                    animation: slide-up 0.6s ease-out;
                    animation-fill-mode: both;
                }
                .animate-float {
                    animation: float 3s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default VideoCallPage;
