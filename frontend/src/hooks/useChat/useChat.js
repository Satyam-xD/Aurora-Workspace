
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import io from 'socket.io-client';

const SOCKET_URL = '/'; // Proxy handles this in dev

export const useChat = () => {
    const { user } = useAuth();
    const [activeChat, setActiveChat] = useState(null);
    const [message, setMessage] = useState('');
    const socketRef = useRef();

    // Dynamic chats data
    const [chatsData, setChatsData] = useState({});

    // Fetch User Chats on Mount
    useEffect(() => {
        const fetchUserChats = async () => {
            const token = user?.token || JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) return;

            try {
                const res = await fetch('/api/chat', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                if (res.ok) {
                    const newChatsData = {};

                    data.forEach(chat => {
                        // Logic for DM name:
                        let displayName = chat.chatName;
                        if (!chat.isGroupChat && chat.users) {
                            // Find user that is not logged in user
                            const otherUser = chat.users.find(u => u._id !== user._id) || chat.users[0];
                            displayName = otherUser?.name || "Unknown User";
                        }

                        // Key by ID now!
                        newChatsData[chat._id] = {
                            id: chat._id,
                            name: displayName, // Store name property
                            type: chat.isGroupChat ? 'group' : 'private',
                            onlineCount: chat.users?.length || 0,
                            messages: [] // Messages will be fetched when active
                        };
                    });

                    setChatsData(newChatsData);

                    // Set first chat as active if none selected
                    if (!activeChat && data.length > 0) {
                        const firstChat = data[0];
                        setActiveChat(firstChat._id); // Set ID
                    }
                }
            } catch (err) {
                console.error("Failed to fetch chats", err);
            }
        };

        if (user) {
            fetchUserChats();
        }
    }, [user, activeChat]);

    const [isTyping, setIsTyping] = useState(false);
    const [typingTimer, setTypingTimer] = useState(null);

    // 1. Connect to Socket
    useEffect(() => {
        socketRef.current = io(SOCKET_URL);

        socketRef.current.on('typing', (room) => {
            if (room === activeChat) setIsTyping(true);
        });
        socketRef.current.on('stopTyping', (room) => {
            if (room === activeChat) setIsTyping(false);
        });

        // Listen for incoming messages
        socketRef.current.on('receiveMessage', (newMessage) => {
            // Ignore own messages to prevent duplicates (since we do optimistic updates)
            if (newMessage.sender._id === user?._id || newMessage.sender === user?._id) return;

            // Format message to match UI structure
            const formattedMsg = {
                id: newMessage._id,
                text: newMessage.text,
                sender: newMessage.sender.name,
                time: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: false, // It's from someone else
                senderAvatar: newMessage.sender.name ? newMessage.sender.name[0] : 'U',
                type: newMessage.type || 'text',
                fullTime: newMessage.createdAt
            };

            // newMessage.room is the Chat ID
            setChatsData(prev => {
                // If chat doesn't exist in local state (e.g. new chat started by someone else), 
                // we might need to fetch it or ignore. 
                // For now, only update if exists.
                if (!prev[newMessage.room]) return prev;

                return {
                    ...prev,
                    [newMessage.room]: {
                        ...prev[newMessage.room],
                        messages: [...(prev[newMessage.room]?.messages || []), formattedMsg]
                    }
                };
            });

            // Play notification sound
            try {
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play();
            } catch (error) {
                console.error("Audio play failed", error);
            }
        });

        return () => {
            socketRef.current.disconnect();
        };
    }, [user]);

    // 2. Join Room & Fetch History on Chat Switch
    useEffect(() => {
        if (!activeChat || !user) return;

        // Join Room (activeChat is ID now)
        socketRef.current.emit('joinRoom', { roomId: activeChat, name: user.name });

        // Fetch History
        const fetchHistory = async () => {
            try {
                const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
                if (!token) return;

                const res = await fetch(`/api/chat/${encodeURIComponent(activeChat)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await res.json();

                if (res.ok) {
                    const formattedMessages = data.map(msg => ({
                        id: msg._id,
                        text: msg.text,
                        sender: msg.sender.name,
                        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        isMe: msg.sender._id === user._id,
                        senderAvatar: msg.sender.name ? msg.sender.name[0] : 'U',
                        type: msg.type || 'text',
                        fullTime: msg.createdAt
                    }));

                    setChatsData(prev => ({
                        ...prev,
                        [activeChat]: {
                            ...prev[activeChat],
                            messages: formattedMessages
                        }
                    }));
                }
            } catch (err) {
                console.error("Failed to fetch chat history", err);
            }
        };

        fetchHistory();

    }, [activeChat, user]);

    const handleSend = (msgType = 'text', msgContent = message) => {
        if ((msgContent.trim() || msgType === 'image') && user) {
            // Optimistic Update
            const tempMsg = {
                id: Date.now(),
                text: msgContent,
                sender: user.name,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: true,
                senderAvatar: user.name[0],
                type: msgType,
                fullTime: new Date().toISOString()
            };

            setChatsData(prev => ({
                ...prev,
                [activeChat]: {
                    ...prev[activeChat],
                    messages: [...(prev[activeChat]?.messages || []), tempMsg]
                }
            }));

            // Emit to socket
            socketRef.current.emit('sendMessage', {
                room: activeChat, // ID
                text: msgContent,
                senderId: user._id || user.id,
                type: msgType
            });

            if (msgType === 'text') {
                setMessage('');
            }
        }
    };

    const handleFileUpload = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;

            const res = await fetch('/api/chat/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                handleSend('image', data.url);
            }
        } catch (err) {
            console.error("Upload failed", err);
        }
    };



    const chats = Object.keys(chatsData); // Array of IDs
    const activeMessages = chatsData[activeChat]?.messages || [];
    const activeOnlineCount = chatsData[activeChat]?.onlineCount || 0;

    const handleCreateGroup = async (groupName) => {
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            if (!token || !groupName) return;

            const res = await fetch('/api/chat/group', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: groupName,
                    users: "[]" // Sending empty users list
                })
            });

            const data = await res.json();

            if (res.ok) {
                setChatsData(prev => ({
                    ...prev,
                    [data._id]: { // Key by ID
                        id: data._id,
                        name: data.chatName,
                        type: 'group',
                        onlineCount: 1,
                        messages: []
                    }
                }));
                setActiveChat(data._id);
            } else {
                alert(data.message || "Failed to create group");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const searchUsers = async (query) => {
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) return [];

            const res = await fetch(`/api/auth/users?search=${query}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            return data;
        } catch (err) {
            console.error("Failed to search users", err);
            return [];
        }
    };

    const handleAccessChat = async (userId) => {
        try {
            const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
            if (!token) return;

            const res = await fetch(`/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId })
            });

            const data = await res.json();

            if (res.ok) {
                // Determine display name for the new chat
                let displayName = "Chat";
                if (!data.isGroupChat && data.users) {
                    const otherUser = data.users.find(u => u._id !== user._id) || data.users[0];
                    displayName = otherUser?.name;
                }

                if (!chatsData[data._id]) {
                    setChatsData(prev => ({
                        ...prev,
                        [data._id]: {
                            id: data._id,
                            name: displayName,
                            type: 'private',
                            onlineCount: 2, // Assume online for now
                            messages: []
                        }
                    }));
                }
                setActiveChat(data._id);
            }
        } catch (err) {
            console.error("Failed to access chat", err);
        }
    };

    const handleTyping = (e) => {
        setMessage(e.target.value);

        if (!socketRef.current) return;

        if (!typingTimer) {
            socketRef.current.emit("typing", activeChat);
        }

        if (typingTimer) clearTimeout(typingTimer);

        const timer = setTimeout(() => {
            socketRef.current.emit("stopTyping", activeChat);
            setTypingTimer(null);
        }, 3000);

        setTypingTimer(timer);
    };

    // Group Management
    const renameGroup = async (chatId, chatName) => {
        const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
        try {
            const res = await fetch('/api/chat/rename', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ chatId, chatName })
            });
            const data = await res.json();
            if (res.ok) {
                // Update local state
                setChatsData(prev => {
                    if (!prev[chatId]) return prev;
                    return {
                        ...prev,
                        [chatId]: {
                            ...prev[chatId],
                            name: chatName
                        }
                    };
                });
            }
            return data;
        } catch (err) {
            console.error(err);
        }
    };

    const addToGroup = async (chatId, userId) => {
        const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
        try {
            const res = await fetch('/api/chat/groupadd', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ chatId, userId })
            });
            return await res.json();
        } catch (err) {
            console.error(err);
        }
    };

    const removeFromGroup = async (chatId, userId) => {
        const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
        try {
            const res = await fetch('/api/chat/groupremove', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ chatId, userId })
            });
            return await res.json();
        } catch (err) {
            console.error(err);
        }
    };

    return {
        message,
        setMessage,
        messages: activeMessages,
        activeChat,
        setActiveChat,
        chats,
        chatsData,
        activeOnlineCount,
        handleSend,
        handleCreateGroup,
        searchUsers,
        handleAccessChat,
        isTyping,
        handleTyping,
        handleFileUpload,
        renameGroup,
        addToGroup,
        removeFromGroup,
        user // Expose user for ID checks
    };
};
