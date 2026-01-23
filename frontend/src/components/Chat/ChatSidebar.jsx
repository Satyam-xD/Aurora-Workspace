
import React, { useRef, useMemo, useCallback, useEffect } from 'react';
import { Search, Plus, MessageSquarePlus, Users } from 'lucide-react';
import { debounce } from 'lodash';

const ChatSidebar = ({ chats, activeChat, setActiveChat, chatsData, onCreateGroup, onSearchUsers, onAccessChat, isMobileMenuOpen, setIsMobileMenuOpen }) => {
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [groupName, setGroupName] = React.useState('');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [searchResults, setSearchResults] = React.useState([]);
    const searchInputRef = useRef(null);

    const handleCreate = () => {
        if (groupName.trim()) {
            onCreateGroup(groupName);
            setGroupName('');
            setIsModalOpen(false);
        }
    };

    // Debounced search function
    const debouncedSearch = useMemo(
        () => debounce(async (query) => {
            if (query.length > 0) {
                const results = await onSearchUsers(query);
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }, 300),
        [onSearchUsers]
    );

    // Cleanup debounce on unmount
    useEffect(() => {
        return () => {
            debouncedSearch.cancel();
        };
    }, [debouncedSearch]);

    const handleSearch = (e) => {
        const query = e.target.value;
        setSearchQuery(query);
        debouncedSearch(query);
    };

    const handleUserClick = (userId) => {
        onAccessChat(userId);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleNewMessage = () => {
        searchInputRef.current?.focus();
    };

    return (
        <div className={`w-80 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 flex flex-col ${isMobileMenuOpen ? 'fixed inset-0 z-50 md:relative' : 'hidden md:flex'
            }`}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
                    <div className="flex gap-2">
                        <button
                            onClick={handleNewMessage}
                            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-aurora-100 dark:hover:bg-aurora-900/30 hover:text-aurora-600 transition"
                            title="New Direct Message"
                        >
                            <MessageSquarePlus size={20} />
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="p-2 bg-aurora-600 text-white rounded-lg hover:bg-aurora-700 transition"
                            title="Create Group"
                        >
                            <Users size={20} />
                        </button>
                    </div>
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search for people..."
                        value={searchQuery}
                        onChange={handleSearch}
                        className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700/50 border-none rounded-xl text-sm focus:ring-2 focus:ring-aurora-500/20 text-gray-900 dark:text-white placeholder-gray-500"
                    />
                </div>
            </div>

            {/* User Search Results */}
            {searchResults.length > 0 && (
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 max-h-48 overflow-y-auto">
                    <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">Users</div>
                    {searchResults.map(user => (
                        <div
                            key={user._id}
                            onClick={() => handleUserClick(user._id)}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center space-x-3"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-bold">
                                {user.name[0]}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className="p-4 bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-sm font-bold mb-2 text-gray-700 dark:text-white">New Group</h3>
                    <div className="flex flex-col gap-2">
                        <input
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            placeholder="Group Name"
                            className="w-full p-2 text-sm rounded border border-gray-300 dark:border-gray-600 dark:bg-gray-800 text-gray-900 dark:text-white"
                        />
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setIsModalOpen(false)} className="px-3 py-1 bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-sm">Cancel</button>
                            <button onClick={handleCreate} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Create</button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                {chats.sort((a, b) => {
                    const msgA = chatsData[a]?.messages?.length > 0 ? chatsData[a].messages[chatsData[a].messages.length - 1] : null;
                    const msgB = chatsData[b]?.messages?.length > 0 ? chatsData[b].messages[chatsData[b].messages.length - 1] : null;

                    // If both have no messages, keep original order (or sort alphabetically)
                    if (!msgA && !msgB) return 0;
                    if (!msgA) return 1; // b comes first
                    if (!msgB) return -1; // a comes first

                    // Sort by time descending (newest first) using fullTime (ISO string)
                    const timeA = new Date(msgA.fullTime || 0).getTime();
                    const timeB = new Date(msgB.fullTime || 0).getTime();

                    return timeB - timeA;
                }).map((chatId, i) => {
                    const chatInfo = chatsData && chatsData[chatId];
                    const chatName = chatInfo?.name || "Unknown";
                    const lastMsg = chatInfo?.messages?.length > 0 ? chatInfo.messages[chatInfo.messages.length - 1] : null;

                    return (
                        <div
                            key={chatId}
                            onClick={() => setActiveChat(chatId)}
                            className={`p-3 mx-2 my-1 rounded-xl cursor-pointer transition-all duration-200 group relative ${activeChat === chatId
                                ? 'bg-aurora-600 text-white shadow-lg shadow-aurora-500/20 ring-2 ring-aurora-600 ring-offset-2 ring-offset-white dark:ring-offset-gray-800'
                                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-900 dark:text-gray-100'
                                }`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-md ${['bg-gradient-to-br from-blue-400 to-blue-600',
                                    'bg-gradient-to-br from-purple-400 to-purple-600',
                                    'bg-gradient-to-br from-green-400 to-green-600',
                                    'bg-gradient-to-br from-orange-400 to-orange-600'][i % 4]
                                    }`}>
                                    {chatName[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className={`text-sm font-semibold truncate ${activeChat === chatId ? 'text-white' : 'text-gray-900 dark:text-gray-100'}`}>
                                            {chatName}
                                        </h3>
                                        <span className={`text-xs ${activeChat === chatId ? 'text-white/80' : 'text-gray-500'} ${chatInfo?.unread && activeChat !== chatId ? 'text-aurora-600 font-bold' : ''}`}>
                                            {lastMsg?.time || ''}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className={`text-xs truncate ${activeChat === chatId ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'} ${chatInfo?.unread && activeChat !== chatId ? 'font-bold text-gray-900 dark:text-white' : ''}`}>
                                            {lastMsg ? (lastMsg.isMe ? `You: ${lastMsg.text}` : lastMsg.text) : 'No messages'}
                                        </p>
                                        {chatInfo?.unread && activeChat !== chatId && (
                                            <div className="flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full ml-2 shadow-sm ring-1 ring-white dark:ring-gray-900">
                                                <span className="text-[10px] font-bold text-white leading-none">
                                                    {chatInfo.unreadCount > 9 ? '9+' : chatInfo.unreadCount}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div >
    );
};

export default ChatSidebar;
