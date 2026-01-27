import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export const setupSocket = (io) => {
    // Track online users: userId -> socketId
    let onlineUsers = new Map();

    io.on('connection', (socket) => {
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

            socket.broadcast.emit("callEnded");
        });

        // Room functionality for scheduled links
        socket.on("joinRoom", ({ roomId, name }) => {
            socket.join(roomId);
            // Notify existing users in the room that a new user has joined
            socket.to(roomId).emit("userJoined", { id: socket.id, name });
        });

        // WebRTC Signaling
        socket.on("callUser", ({ userToCall, signalData, from, name }) => {
            console.log(`Call initiated from ${from} to ${userToCall}`);
            io.to(userToCall).emit("callUser", { signal: signalData, from, name });
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
