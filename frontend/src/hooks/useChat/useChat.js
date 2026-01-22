
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

    // Caching and deduplication
    const [fetchedChats, setFetchedChats] = useState(new Set());
    const sentMessageIdsRef = useRef(new Set());

    // Loading states
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isUploadingFile, setIsUploadingFile] = useState(false);

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
                        let initialMessages = [];
                        if (chat.latestMessage) {
                            const msg = chat.latestMessage;
                            const senderName = msg.sender?.name || "Unknown";

                            initialMessages = [{
                                id: msg._id,
                                text: msg.text,
                                sender: senderName,
                                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                isMe: (msg.sender?._id || msg.sender) === user._id,
                                senderAvatar: senderName ? senderName[0] : 'U',
                                type: msg.type || 'text',
                                fullTime: msg.createdAt
                            }];
                        }

                        newChatsData[chat._id] = {
                            id: chat._id,
                            name: displayName,
                            type: chat.isGroupChat ? 'group' : 'private',
                            onlineCount: chat.users?.length || 0,
                            messages: initialMessages,
                            unread: false
                        };

                        // Join the socket room for this chat to receive updates
                        if (socketRef.current) {
                            socketRef.current.emit('joinRoom', { roomId: chat._id, name: user.name });
                        }
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
    }, [user]); // Removed activeChat to prevent infinite loop

    const [isTyping, setIsTyping] = useState(false);
    const [typingTimer, setTypingTimer] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);

    const activeChatRef = useRef(activeChat);
    useEffect(() => {
        activeChatRef.current = activeChat;
    }, [activeChat]);

    // 1. Connect to Socket
    useEffect(() => {
        socketRef.current = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        if (user) {
            socketRef.current.emit("setup", user);
        }

        socketRef.current.on('connected', () => {
            console.log('Socket connected');
            setSocketConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
            setSocketConnected(false);
        });

        socketRef.current.on('reconnect', (attemptNumber) => {
            console.log('Socket reconnected after', attemptNumber, 'attempts');
            setSocketConnected(true);

            // Rejoin all rooms after reconnection
            if (user) {
                Object.values(chatsData).forEach(chat => {
                    socketRef.current.emit('joinRoom', { roomId: chat.id, name: user.name });
                });
            }
        });

        socketRef.current.on('typing', (room) => {
            if (activeChatRef.current === room) setIsTyping(true);
        });
        socketRef.current.on('stopTyping', (room) => {
            if (activeChatRef.current === room) setIsTyping(false);
        });

        // Listen for incoming messages
        socketRef.current.on('receiveMessage', (newMessage) => {
            console.log('Received message:', newMessage);

            // Deduplication check
            if (sentMessageIdsRef.current.has(newMessage._id)) {
                console.log('Duplicate message, ignoring');
                return;
            }

            // Handle own messages - add to dedup set but don't display (we have optimistic update)
            const isOwnMessage = newMessage.sender._id === user?._id || newMessage.sender === user?._id;
            if (isOwnMessage) {
                console.log('Own message received, adding to dedup set');
                sentMessageIdsRef.current.add(newMessage._id);
                return; // Still return to avoid duplicate display
            }

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

            // chatId logic
            let chatId = newMessage.room;
            let chatObj = null;

            if (newMessage.chat && newMessage.chat._id) {
                chatId = newMessage.chat._id;
                chatObj = newMessage.chat;
            }

            setChatsData(prev => {
                const isCurrentChat = chatId === activeChatRef.current;

                // If chat exists, update it
                if (prev[chatId]) {
                    return {
                        ...prev,
                        [chatId]: {
                            ...prev[chatId],
                            messages: [...(prev[chatId]?.messages || []), formattedMsg],
                            unread: !isCurrentChat
                        }
                    };
                }

                // If chat DOES NOT exist (New Chat scenario), construct it from payload
                if (chatObj) {
                    let displayName = chatObj.chatName;
                    if (!chatObj.isGroupChat && chatObj.users) {
                        const otherUser = chatObj.users.find(u => u._id !== user._id) || chatObj.users[0];
                        displayName = otherUser?.name || "Unknown User";
                    }

                    return {
                        ...prev,
                        [chatId]: {
                            id: chatId,
                            name: displayName,
                            type: chatObj.isGroupChat ? 'group' : 'private',
                            onlineCount: chatObj.users?.length || 0,
                            messages: [formattedMsg],
                            unread: !isCurrentChat
                        }
                    };
                }

                return prev;
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
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
            setSocketConnected(false);
        };
    }, [user]);

    // Cleanup typing timer on unmount
    useEffect(() => {
        return () => {
            if (typingTimer) {
                clearTimeout(typingTimer);
            }
        };
    }, [typingTimer]);

    // New Effect to Join Rooms when Socket is Ready AND Chats are loaded
    useEffect(() => {
        if (socketConnected && socketRef.current && user) {
            Object.values(chatsData).forEach(chat => {
                socketRef.current.emit('joinRoom', { roomId: chat.id, name: user.name });
            });
        }
    }, [chatsData, socketConnected, user]);

    // 2. Join Room & Fetch History on Chat Switch (with caching)
    useEffect(() => {
        if (!activeChat || !user) return;

        console.log('\ud83d\udeaa Attempting to join room:', activeChat);
        console.log('Socket connected:', socketConnected);
        console.log('Socket ref exists:', !!socketRef.current);


        // Join Room only if socket is connected
        if (socketRef.current && socketConnected) {
            console.log('\u2705 Joining room:', activeChat, 'as', user.name);
            socketRef.current.emit('joinRoom', { roomId: activeChat, name: user.name });
        } else if (socketRef.current) {
            console.log('\u26a0\ufe0f Socket not ready, will join when connected');

            const handleConnected = () => {
                console.log('\ud83d\udd04 Socket connected! Joining room:', activeChat);
                socketRef.current.emit('joinRoom', { roomId: activeChat, name: user.name });
            };

            socketRef.current.once('connected', handleConnected);

            return () => {
                if (socketRef.current) {
                    socketRef.current.off('connected', handleConnected);
                }
            };
        }


        // Only fetch if not already cached
        if (fetchedChats.has(activeChat)) {
            // Mark as read
            setChatsData(prev => ({
                ...prev,
                [activeChat]: {
                    ...prev[activeChat],
                    unread: false
                }
            }));
            return;
        }

        // Fetch History
        const fetchHistory = async () => {
            setIsLoadingHistory(true);
            try {
                const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
                if (!token) return;

                const res = await fetch(`/api/chat/${encodeURIComponent(activeChat)}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const responseData = await res.json();

                if (res.ok) {
                    // Handle both old and new API response formats
                    const messagesArray = responseData.messages || responseData;

                    const formattedMessages = messagesArray.map(msg => ({
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
                            messages: formattedMessages,
                            unread: false
                        }
                    }));

                    // Mark as fetched
                    setFetchedChats(prev => new Set([...prev, activeChat]));
                }
            } catch (err) {
                console.error("Failed to fetch chat history", err);
            } finally {
                setIsLoadingHistory(false);
            }
        };

        fetchHistory();

    }, [activeChat, user, fetchedChats, socketConnected]);

    // Polling effect - fetch new messages every 3 seconds for async messaging
    useEffect(() => {
        if (!activeChat || !user) return;

        const pollMessages = async () => {
            try {
                const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;
                if (!token) return;

                const res = await fetch(`/api/chat/${encodeURIComponent(activeChat)}?limit=10`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const responseData = await res.json();

                if (res.ok) {
                    const messagesArray = responseData.messages || responseData;

                    setChatsData(prev => {
                        // Only update if we have new messages
                        const currentMessages = prev[activeChat]?.messages || [];
                        const latestCurrentId = currentMessages[currentMessages.length - 1]?.id;
                        const latestFetchedId = messagesArray[messagesArray.length - 1]?._id;

                        if (latestCurrentId !== latestFetchedId) {
                            const formattedMessages = messagesArray.map(msg => ({
                                id: msg._id,
                                text: msg.text,
                                sender: msg.sender.name,
                                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                isMe: msg.sender._id === user._id,
                                senderAvatar: msg.sender.name ? msg.sender.name[0] : 'U',
                                type: msg.type || 'text',
                                fullTime: msg.createdAt
                            }));

                            return {
                                ...prev,
                                [activeChat]: {
                                    ...prev[activeChat],
                                    messages: formattedMessages,
                                    unread: false
                                }
                            };
                        }
                        return prev;
                    });
                }
            } catch (err) {
                console.error("Polling error:", err);
            }
        };

        // Poll every 3 seconds
        const intervalId = setInterval(pollMessages, 3000);

        // Cleanup
        return () => clearInterval(intervalId);
    }, [activeChat, user]); // Removed chatsData from dependencies

    const handleSend = async (msgType = 'text', msgContent = message) => {
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

            // Send via HTTP API to persist in database
            try {
                const token = user.token || JSON.parse(localStorage.getItem('user'))?.token;

                const res = await fetch('/api/chat/message', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        chatId: activeChat,
                        text: msgContent,
                        type: msgType
                    })
                });

                if (!res.ok) {
                    throw new Error('Failed to send message');
                }

                const savedMessage = await res.json();
                console.log('✅ Message saved to database:', savedMessage);

                // Update with real message from server
                setChatsData(prev => ({
                    ...prev,
                    [activeChat]: {
                        ...prev[activeChat],
                        messages: prev[activeChat].messages.map(msg =>
                            msg.id === tempMsg.id ? {
                                ...msg,
                                id: savedMessage._id,
                                fullTime: savedMessage.createdAt
                            } : msg
                        )
                    }
                }));

                // Also emit to socket for real-time updates (if connected)
                if (socketRef.current && socketConnected) {
                    socketRef.current.emit('sendMessage', {
                        room: activeChat,
                        text: msgContent,
                        senderId: user._id || user.id,
                        type: msgType
                    });
                }

            } catch (err) {
                console.error('Failed to send message:', err);
                alert('Failed to send message. Please try again.');

                // Remove optimistic message on error
                setChatsData(prev => ({
                    ...prev,
                    [activeChat]: {
                        ...prev[activeChat],
                        messages: prev[activeChat].messages.filter(msg => msg.id !== tempMsg.id)
                    }
                }));
            }

            if (msgType === 'text') {
                setMessage('');
            }
        }
    };

    const handleFileUpload = async (file) => {
        // File validation
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        const ALLOWED_FILE_TYPES = [...ALLOWED_IMAGE_TYPES, 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

        if (!file) {
            console.error('No file selected');
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            alert(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        // Check file type
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
            alert('Invalid file type. Allowed: Images, PDF, Word documents, and text files');
            return;
        }

        setIsUploadingFile(true);
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

            if (!res.ok) {
                throw new Error(`Upload failed: ${res.statusText}`);
            }

            const data = await res.json();

            if (res.ok && data.url) {
                const fileType = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'file';
                handleSend(fileType, data.url);
            } else {
                throw new Error(data.message || 'Upload failed');
            }
        } catch (err) {
            console.error("Upload failed", err);
            alert(`Upload failed: ${err.message}`);
        } finally {
            setIsUploadingFile(false);
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
                        messages: [],
                        unread: false
                    }
                }));
                if (socketRef.current) {
                    socketRef.current.emit('joinRoom', { roomId: data._id, name: user.name });
                }
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
                            messages: [],
                            unread: false
                        }
                    }));
                    if (socketRef.current) {
                        socketRef.current.emit('joinRoom', { roomId: data._id, name: user.name });
                    }
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
            const data = await res.json();
            if (res.ok) {
                setChatsData(prev => {
                    if (!prev[chatId]) return prev;
                    return {
                        ...prev,
                        [chatId]: {
                            ...prev[chatId],
                            onlineCount: data.users.length
                        }
                    };
                });
            }
            return data;
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
            const data = await res.json();
            if (res.ok) {
                // If I removed myself, maybe delete the chat from local state?
                // The user logic is: removeFromGroup(chatsData[activeChat].id, currentUser._id);
                if (userId === user._id) {
                    setChatsData(prev => {
                        const newState = { ...prev };
                        delete newState[chatId];
                        return newState;
                    });
                    setActiveChat(null);
                } else {
                    setChatsData(prev => {
                        if (!prev[chatId]) return prev;
                        return {
                            ...prev,
                            [chatId]: {
                                ...prev[chatId],
                                onlineCount: data.users.length
                            }
                        };
                    });
                }
            }
            return data;
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
        user, // Expose user for ID checks
        isLoadingHistory,
        isUploadingFile
    };
};
