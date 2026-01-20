import asyncHandler from 'express-async-handler';
import Task from '../models/Task.js';
import Team from '../models/Team.js'; // Added import

// @desc    Get tasks (Visible to everyone in the team)
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
    // Find teams where user is owner or member
    const teams = await Team.find({
        $or: [
            { owner: req.user.id },
            { members: req.user.id }
        ]
    });

    const teamIds = teams.map(t => t._id);

    // Fetch tasks belonging to these teams
    // Also fetch legacy tasks created by this user (for backward compatibility)
    const tasks = await Task.find({
        $or: [
            { team: { $in: teamIds } },
            { user: req.user.id } // Legacy support
        ]
    })
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 });

    res.status(200).json(tasks);
});

// @desc    Set task (Admin/Head only)
// @route   POST /api/tasks
// @access  Private
// @desc    Set task (Admin/Head only)
// @route   POST /api/tasks
// @access  Private
const setTask = asyncHandler(async (req, res) => {
    if (!req.body.title) {
        res.status(400);
        throw new Error('Please add a title field');
    }

    // Restrict creation to Team Head or Admin
    if (req.user.role === 'team_member') {
        res.status(403);
        throw new Error('Only Team Heads can create tasks');
    }

    // Require teamId
    // If user has old frontend code, they might not send teamId. 
    // We should try to gracefully handle it or force it.
    // Let's look for req.body.teamId
    let teamId = req.body.teamId;

    if (!teamId) {
        // Fallback: If no teamId provided, try to find the FIRST team owned by user (Legacy behavior)
        const team = await Team.findOne({ owner: req.user.id });
        if (!team) {
            res.status(404);
            throw new Error('You need to create a Team first');
        }
        teamId = team._id;
    }

    // Verify ownership of the team
    const team = await Team.findOne({ _id: teamId, owner: req.user.id });
    if (!team) {
        res.status(403);
        throw new Error('You can only create tasks for teams you own');
    }

    // If assigning to a user, verify they are in this team
    if (req.body.assignedTo) {
        const isMember = team.members.includes(req.body.assignedTo);
        if (!isMember) {
            res.status(400);
            throw new Error('Assigned user is not a member of this team');
        }
    }

    const task = await Task.create({
        title: req.body.title,
        description: req.body.description,
        status: req.body.status || 'To Do',
        priority: req.body.priority || 'medium',
        tag: req.body.tag || 'General',
        user: req.user.id, // Creator
        team: team._id,
        assignedTo: req.body.assignedTo || null,
        dueDate: req.body.dueDate || null,
    });

    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email');
    res.status(200).json(populatedTask);
});

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(400);
        throw new Error('Task not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    const isCreator = task.user.toString() === req.user.id;
    const isAssigned = task.assignedTo && task.assignedTo.toString() === req.user.id;
    const isHead = req.user.role === 'team_head' || req.user.role === 'admin';

    // 1. Team Head/Admin/Creator: Can update EVERYTHING
    if (isHead || isCreator) {
        const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
        }).populate('assignedTo', 'name email');
        return res.status(200).json(updatedTask);
    }

    // 2. Member: Can ONLY update STATUS, and only if assigned to them
    if (req.user.role === 'team_member') {
        if (!isAssigned) {
            res.status(403);
            throw new Error('You can only update tasks assigned to you');
        }

        // Restrict updates to only 'status'
        // If they try to change title/desc/priority, ignore those or throw error?
        // Let's just create an update object with ONLY status.
        const { status } = req.body;

        // If they are trying to send other fields, we could error, 
        // but for better UX just ignore them and only apply status if present.
        if (!status) {
            // If they sent a request without status (e.g. edit description), deny it.
            res.status(403);
            throw new Error('Members can only update task status');
        }

        const updatedTask = await Task.findByIdAndUpdate(req.params.id, { status }, {
            new: true,
        }).populate('assignedTo', 'name email');
        return res.status(200).json(updatedTask);
    }

    res.status(403);
    throw new Error('Not authorized to update this task');
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = asyncHandler(async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (!task) {
        res.status(400);
        throw new Error('Task not found');
    }

    if (!req.user) {
        res.status(401);
        throw new Error('User not found');
    }

    // Only Creator (Head) or Admin can delete
    const isCreator = task.user.toString() === req.user.id;
    const isHead = req.user.role === 'team_head' || req.user.role === 'admin';

    if (!isCreator && !isHead) {
        res.status(403);
        throw new Error('Only Team Heads can delete tasks');
    }

    await task.deleteOne();

    res.status(200).json({ id: req.params.id });
});

export { getTasks, setTask, updateTask, deleteTask };
