import asyncHandler from 'express-async-handler';
import Password from '../models/Password.js';

// @desc    Get all passwords for user
// @route   GET /api/passwords
// @access  Private
const getPasswords = asyncHandler(async (req, res) => {
    const passwords = await Password.find({ user: req.user._id }).sort({ updatedAt: -1 });
    res.json(passwords);
});

// @desc    Create a new password entry
// @route   POST /api/passwords
// @access  Private
const createPassword = asyncHandler(async (req, res) => {
    const { title, username, password, url, category, notes } = req.body;

    if (!title || !username || !password) {
        res.status(400);
        throw new Error('Please fill in all required fields');
    }

    const newPassword = await Password.create({
        user: req.user._id,
        title,
        username,
        password,
        url,
        category,
        notes,
    });

    res.status(201).json(newPassword);
});

// @desc    Update a password entry
// @route   PUT /api/passwords/:id
// @access  Private
const updatePassword = asyncHandler(async (req, res) => {
    const pass = await Password.findById(req.params.id);

    if (!pass) {
        res.status(404);
        throw new Error('Password entry not found');
    }

    // Check user
    if (pass.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    pass.title = req.body.title !== undefined ? req.body.title : pass.title;
    pass.username = req.body.username !== undefined ? req.body.username : pass.username;
    pass.password = req.body.password !== undefined ? req.body.password : pass.password;
    pass.url = req.body.url !== undefined ? req.body.url : pass.url;
    pass.category = req.body.category !== undefined ? req.body.category : pass.category;
    pass.notes = req.body.notes !== undefined ? req.body.notes : pass.notes;

    const updatedPassword = await pass.save();
    res.json(updatedPassword);
});

// @desc    Delete a password entry
// @route   DELETE /api/passwords/:id
// @access  Private
const deletePassword = asyncHandler(async (req, res) => {
    const pass = await Password.findById(req.params.id);

    if (!pass) {
        res.status(404);
        throw new Error('Password entry not found');
    }

    // Check user
    if (pass.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('User not authorized');
    }

    await pass.deleteOne();
    res.json({ id: req.params.id });
});

export { getPasswords, createPassword, updatePassword, deletePassword };
