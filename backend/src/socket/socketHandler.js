import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export const setupSocket = (io) => {
    // Track online users: userId -> socketId
    let onlineUsers = new Map();

    // Video Call Room Management - MUST be outside connection handler
    const videoRooms = new Map(); // roomId -> Map of { userId, userName, socketId }

    io.on('connection', (socket) => {
        console.log(`Socket Connected: ${socket.id}`);
        socket.emit("me", socket.id);

        socket.on("setup", (userData) => {
            const userId = userData?._id || userData?.id;
            if (userId) {
                socket.join(userId);
                onlineUsers.set(userId, socket.id);
                console.log(`User ${userId} joined their personal room`);

                // Broadcast online users list to everyone
                io.emit("onlineUsers", Array.from(onlineUsers.keys()));
                socket.emit("connected");
            }
        });

        socket.on("disconnect", () => {
            // Find key by value to remove
            let disconnectedUserId;
            for (let [userId, socketId] of onlineUsers.entries()) {
                if (socketId === socket.id) {
                    disconnectedUserId = userId;
                    break;
                }
            }

            if (disconnectedUserId) {
                onlineUsers.delete(disconnectedUserId);
                io.emit("onlineUsers", Array.from(onlineUsers.keys()));
            }

            // Clean up video rooms when user disconnects
            videoRooms.forEach((room, roomId) => {
                room.forEach((participant, userId) => {
                    if (participant.socketId === socket.id) {
                        room.delete(userId);

                        const participants = Array.from(room.values()).map(p => ({
                            id: p.userId,
                            name: p.userName
                        }));

                        io.to(roomId).emit("userLeftRoom", {
                            userId,
                            participants
                        });

                        if (room.size === 0) {
                            videoRooms.delete(roomId);
                            console.log(`Room ${roomId} deleted (empty after disconnect)`);
                        }
                    }
                });
            });

            socket.broadcast.emit("callEnded");
        });

        // Video Call Room - Single unified handler
        socket.on("joinRoom", ({ roomId, userId, userName, name }) => { // Added 'name' for legacy
            // Handle video call rooms (with userId and userName)
            if (userId && userName) {
                console.log(`${userName} (${userId}) joining video room ${roomId}`);

                // Initialize room if it doesn't exist
                if (!videoRooms.has(roomId)) {
                    videoRooms.set(roomId, new Map());
                }

                const room = videoRooms.get(roomId);

                // Add user to room
                const uid = userId.toString();
                room.set(uid, { userId: uid, userName, socketId: socket.id });
                socket.join(roomId);

                // Get all participants
                const participants = Array.from(room.values()).map(p => ({
                    id: p.userId,
                    name: p.userName
                }));

                // Send full participant list to the user who just joined
                socket.emit("roomJoined", {
                    participants
                });

                // Notify OTHER users in room about new participant
                socket.to(roomId).emit("userJoinedRoom", {
                    userId: uid,
                    userName,
                    participants
                });

                console.log(`[VideoRoom] ${roomId}: ${userName} joined. Total: ${room.size}`);
            } else {
                // Legacy room join (for other features, e.g., scheduled links)
                socket.join(roomId);
                // Notify existing users in the room that a new user has joined
                socket.to(roomId).emit("userJoined", { id: socket.id, name });
            }
        });

        socket.on("leaveRoom", ({ roomId, userId }) => {
            console.log(`User ${userId} leaving room ${roomId}`);

            const room = videoRooms.get(roomId);
            if (room) {
                room.delete(userId);
                socket.leave(roomId);

                const participants = Array.from(room.values()).map(p => ({
                    id: p.userId,
                    name: p.userName
                }));

                // Notify remaining users
                io.to(roomId).emit("userLeftRoom", {
                    userId,
                    participants
                });

                // Clean up empty rooms
                if (room.size === 0) {
                    videoRooms.delete(roomId);
                    console.log(`Room ${roomId} deleted (empty)`);
                }
            }
        });

        // WebRTC Signaling for rooms
        socket.on("sendOffer", ({ to, offer, roomId }) => {
            const room = videoRooms.get(roomId);
            if (room) {
                const recipient = Array.from(room.values()).find(p => p.userId === to);
                if (recipient) {
                    const sender = Array.from(room.values()).find(p => p.socketId === socket.id);
                    if (sender) {
                        io.to(recipient.socketId).emit("receiveOffer", {
                            from: sender.userId,
                            fromName: sender.userName,
                            offer
                        });
                    }
                }
            }
        });

        socket.on("sendAnswer", ({ to, answer, roomId }) => {
            const room = videoRooms.get(roomId);
            if (room) {
                const recipient = Array.from(room.values()).find(p => p.userId === to);
                if (recipient) {
                    const sender = Array.from(room.values()).find(p => p.socketId === socket.id);
                    if (sender) {
                        io.to(recipient.socketId).emit("receiveAnswer", {
                            from: sender.userId,
                            answer
                        });
                    }
                }
            }
        });

        socket.on("sendIceCandidate", ({ to, candidate, roomId }) => {
            const room = videoRooms.get(roomId);
            if (room) {
                const recipient = Array.from(room.values()).find(p => p.userId === to);
                if (recipient) {
                    io.to(recipient.socketId).emit("receiveIceCandidate", {
                        from: Array.from(room.values()).find(p => p.socketId === socket.id)?.userId,
                        candidate
                    });
                }
            }
        });

        // Room messaging
        socket.on("roomMessage", ({ roomId, message }) => {
            console.log(`Message in room ${roomId} from ${message.sender}: ${message.text}`);
            // Broadcast message to all other users in the room
            socket.to(roomId).emit("roomMessage", { message });
        });

        // WebRTC Signaling (legacy 1-to-1 calls)
        socket.on("callUser", ({ userToCall, signalData, from, name, isVideo }) => {
            console.log(`Call initiated from ${from} to ${userToCall} (Video: ${isVideo})`);
            io.to(userToCall).emit("callUser", { signal: signalData, from, name, isVideo });
        });

        socket.on("answerCall", (data) => {
            console.log(`Call answered by ${socket.id} to ${data.to}`);
            io.to(data.to).emit("callAccepted", data.signal);
        });

        socket.on("ice-candidate", ({ to, candidate }) => {
            console.log(`ICE candidate from ${socket.id} to ${to}`);
            io.to(to).emit("ice-candidate", candidate);
        });

        socket.on("endCall", ({ to }) => {
            console.log(`Call ended by ${socket.id} for ${to}`);
            io.to(to).emit("callEnded");
        });

        // Chat functionality
        socket.on("typing", (room) => socket.in(room).emit("typing", room));
        socket.on("stopTyping", (room) => socket.in(room).emit("stopTyping", room));

        socket.on("sendMessage", async ({ room, text, senderId, type }) => {
            try {
                const newMessage = await Message.create({
                    chat: room,
                    text,
                    sender: senderId,
                    type: type || 'text'
                });

                const populatedMessage = await Message.findById(newMessage._id)
                    .populate('sender', 'name email')
                    .populate({
                        path: 'chat',
                        populate: {
                            path: 'users',
                            select: 'name email pic'
                        }
                    });

                // Update latest message in conversation
                await Conversation.findByIdAndUpdate(room, {
                    latestMessage: newMessage
                });

                // Emit to the room (good for general updates)
                io.to(room).emit("receiveMessage", populatedMessage);

                // Also emit to each user's personal room to ensure "New Chat" notifications work
                populatedMessage.chat.users.forEach(user => {
                    if (user._id.toString() === senderId.toString()) return;
                    io.to(user._id.toString()).emit("receiveMessage", populatedMessage);
                });
            } catch (error) {
                console.error("Socket Send Message Error:", error);
            }
        });
    });
};
