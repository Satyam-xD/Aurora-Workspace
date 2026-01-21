import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';

// @desc    Get chat history for a room
// @route   GET /api/chat/:room
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
    const { room } = req.params;

    const messages = await Message.find({ chat: room })
        .populate('sender', 'name email')
        .sort({ createdAt: 1 }) // Oldest first
        .limit(50); // Limit to last 50 for performance

    res.json(messages);
});

export { getChatHistory };
