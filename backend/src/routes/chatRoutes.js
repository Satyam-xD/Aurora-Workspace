import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { getChatHistory, sendMessage } from '../controllers/chatController.js';
import {
    accessChat,
    fetchChats,
    createGroupChat,
    renameGroup,
    addToGroup,
    removeFromGroup,
    uploadAttachment
} from '../controllers/conversationController.js';

const router = express.Router();

// Conversation Routes
router.route('/').post(protect, accessChat).get(protect, fetchChats);
router.route('/group').post(protect, createGroupChat);
router.route('/rename').put(protect, renameGroup);
router.route('/groupadd').put(protect, addToGroup);
router.route('/groupremove').put(protect, removeFromGroup);

// Message Routes
router.route('/message').post(protect, sendMessage); // New HTTP endpoint for sending messages
router.route('/upload').post(protect, uploadAttachment);
router.get('/:room', protect, getChatHistory);

export default router;
