
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import io from 'socket.io-client';

const ChatContext = createContext();

const SOCKET_URL = '/';

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [activeChat, setActiveChat] = useState(null);
    const [chatsData, setChatsData] = useState({});
    const [socketConnected, setSocketConnected] = useState(false);
    const socketRef = useRef();
    const [totalUnreadCount, setTotalUnreadCount] = useState(0);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [fetchedChats, setFetchedChats] = useState(new Set());
    const sentMessageIdsRef = useRef(new Set());
    const processedMessageIdsRef = useRef(new Set());
    const [onlineUsers, setOnlineUsers] = useState(new Set()); // New state for online users

    const notificationSoundRef = useRef(null);

    // Initialize notification sound
    useEffect(() => {
        notificationSoundRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    // Calculate total unread count whenever chatsData changes
    useEffect(() => {
        const count = Object.values(chatsData).reduce((total, chat) => {
            return total + (chat.unreadCount || 0);
        }, 0);
        setTotalUnreadCount(count);
    }, [chatsData]);

    const activeChatRef = useRef(activeChat);
    useEffect(() => {
        activeChatRef.current = activeChat;

        // Reset unread for active chat
        if (activeChat) {
            setChatsData(prev => {
                if (!prev[activeChat]) return prev;
                return {
                    ...prev,
                    [activeChat]: {
                        ...prev[activeChat],
                        unread: false,
                        unreadCount: 0
                    }
                };
            });
        }
    }, [activeChat]);

    // Fetch User Chats
    const fetchUserChats = useCallback(async () => {
        const token = user?.token || JSON.parse(localStorage.getItem('user'))?.token;
        if (!token) return;

        try {
            const res = await fetch('/api/chat', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (res.ok) {
                setChatsData(prevChatsData => {
                    const newChatsData = { ...prevChatsData };
                    let hasChanges = false;

                    data.forEach(chat => {
                        let displayName = chat.chatName;
                        if (!chat.isGroupChat && chat.users) {
                            const otherUser = chat.users.find(u => u._id !== (user?._id || user?.id)) || chat.users[0];
                            displayName = otherUser?.name || "Unknown User";
                        }

                        let initialMessages = [];
                        if (chat.latestMessage) {
                            const msg = chat.latestMessage;
                            const senderName = msg.sender?.name || "Unknown";

                            initialMessages = [{
                                id: msg._id,
                                text: msg.text,
                                sender: senderName,
                                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                isMe: (msg.sender?._id || msg.sender) === (user?._id || user?.id),
                                senderAvatar: senderName ? senderName[0] : 'U',
                                type: msg.type || 'text',
                                fullTime: msg.createdAt
                            }];
                        }

                        if (!newChatsData[chat._id]) {
                            newChatsData[chat._id] = {
                                id: chat._id,
                                name: displayName,
                                type: chat.isGroupChat ? 'group' : 'private',
                                isGroupChat: chat.isGroupChat,
                                users: chat.users || [],
                                groupAdmin: chat.groupAdmin,
                                onlineCount: chat.users?.length || 0,
                                messages: initialMessages,
                                unread: false,
                                unreadCount: 0
                            };
                            hasChanges = true;
                        }
                    });

                    return hasChanges ? newChatsData : prevChatsData;
                });
            }
        } catch (err) {
            console.error("Failed to fetch chats", err);
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            fetchUserChats();
        }
    }, [user, fetchUserChats]);

    // Socket Connection
    useEffect(() => {
        if (!user) return;

        socketRef.current = io(SOCKET_URL, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5
        });

        socketRef.current.emit("setup", user);

        socketRef.current.on('connected', () => {
            console.log('Socket connected');
            setSocketConnected(true);
        });

        socketRef.current.on('disconnect', () => {
            console.log('Socket disconnected');
            setSocketConnected(false);
            setOnlineUsers(new Set()); // Clear online users on disconnect
        });

        // Listen for online users updates
        socketRef.current.on('onlineUsers', (users) => {
            setOnlineUsers(new Set(users));
        });

        socketRef.current.on('receiveMessage', (newMessage) => {
            // ... existing receiveMessage logic
            if (sentMessageIdsRef.current.has(newMessage._id)) return;

            const isOwnMessage = newMessage.sender._id === user?._id || newMessage.sender === user?._id;
            if (isOwnMessage) {
                sentMessageIdsRef.current.add(newMessage._id);
                return;
            }

            const formattedMsg = {
                id: newMessage._id,
                text: newMessage.text,
                sender: newMessage.sender.name,
                time: new Date(newMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isMe: false,
                senderAvatar: newMessage.sender.name ? newMessage.sender.name[0] : 'U',
                type: newMessage.type || 'text',
                fullTime: newMessage.createdAt
            };

            let chatId = newMessage.chat?._id || newMessage.room;

            setChatsData(prev => {
                const isCurrentChat = chatId === activeChatRef.current;
                const existingChat = prev[chatId];

                if (existingChat) {
                    return {
                        ...prev,
                        [chatId]: {
                            ...existingChat,
                            messages: [...(existingChat.messages || []), formattedMsg],
                            unread: !isCurrentChat,
                            unreadCount: isCurrentChat ? 0 : (existingChat.unreadCount || 0) + 1
                        }
                    };
                }

                if (newMessage.chat) {
                    let displayName = newMessage.chat.chatName;
                    if (!newMessage.chat.isGroupChat && newMessage.chat.users) {
                        const otherUser = newMessage.chat.users.find(u => u._id !== user._id) || newMessage.chat.users[0];
                        displayName = otherUser?.name || "Unknown User";
                    }

                    return {
                        ...prev,
                        [chatId]: {
                            id: chatId,
                            name: displayName,
                            type: newMessage.chat.isGroupChat ? 'group' : 'private',
                            isGroupChat: newMessage.chat.isGroupChat,
                            users: newMessage.chat.users || [],
                            groupAdmin: newMessage.chat.groupAdmin,
                            messages: [formattedMsg],
                            unread: !isCurrentChat,
                            unreadCount: isCurrentChat ? 0 : 1
                        }
                    };
                }

                return prev;
            });

            if (chatId !== activeChatRef.current) {
                notificationSoundRef.current?.play().catch(() => { });
            }
        });

        return () => {
            socketRef.current?.disconnect();
        };
    }, [user]);

    // Video Call State
    const [call, setCall] = useState({});
    const [callAccepted, setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [stream, setStream] = useState(null);

    const startCall = (userId, userName, isVideo = true) => {
        setIsCalling(true);
        setCall({ isReceivingCall: false, userToCall: userId, name: userName, isVideo });
        // The VideoCall component will handle the actual signaling creation when it mounts and sees 'isCalling'
    };

    const answerCall = () => {
        setCallAccepted(true);
    };

    const endCall = () => {
        setCall({});
        setCallAccepted(false);
        setCallEnded(true); // Trigger cleanup
        setIsCalling(false);
        setTimeout(() => setCallEnded(false), 1000); // Reset after cleanup
    };

    // Ringtone logic
    const ringtoneRef = useRef(null);
    useEffect(() => {
        // Initialize ringtone
        ringtoneRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/1359/1359-preview.mp3');
        ringtoneRef.current.loop = true;
    }, []);

    useEffect(() => {
        if (call.isReceivingCall && !callAccepted) {
            ringtoneRef.current?.play().catch(e => console.log("Audio play failed", e));
        } else {
            if (ringtoneRef.current) {
                ringtoneRef.current.pause();
                ringtoneRef.current.currentTime = 0;
            }
        }
    }, [call.isReceivingCall, callAccepted]);

    // Socket listeners for Calls
    useEffect(() => {
        if (!socketRef.current) return;

        socketRef.current.on('callUser', ({ from, name, signal, isVideo }) => {
            console.log("Receiving call from", name, "Video:", isVideo);
            setCall({ isReceivingCall: true, from, name, signal, isVideo });
        });

        // We also need to listen for callEnded from remote here? 
        // Or let the VideoCall component handle it? 
        // The VideoCall component handles 'callEnded' event to close itself.

        return () => {
            socketRef.current?.off('callUser');
        };
    }, [socketConnected]);

    const value = {
        activeChat,
        setActiveChat,
        chatsData,
        setChatsData,
        totalUnreadCount,
        socketRef,
        socketConnected,
        isLoadingHistory,
        setIsLoadingHistory,
        fetchedChats,
        setFetchedChats,
        fetchUserChats,
        user,
        onlineUsers,
        chats: Object.values(chatsData), // Export chats as array
        // Call additions
        call,
        callAccepted,
        callEnded,
        isCalling,
        startCall,
        answerCall,
        endCall,
        setCallAccepted
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChatContext = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within a ChatProvider');
    }
    return context;
};
