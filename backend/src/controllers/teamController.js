import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Team from '../models/Team.js';
import Activity from '../models/Activity.js';
import { createNotifications } from '../utils/notificationService.js';

// Helper to get stats properly
// Helper to get stats properly
const getMemberStats = async (memberId) => {
    try {
        if (!memberId) return { tasksAssigned: 0, tasksCompleted: 0 };

        // Count tasks ASSIGNED to this member
        const tasksAssigned = await Task.countDocuments({ assignedTo: memberId });

        // Count tasks ACTUALLY COMPLETED by this member (regardless of who it was assigned to)
        const tasksCompleted = await Task.countDocuments({ completedBy: memberId });

        return { tasksAssigned, tasksCompleted };
    } catch (error) {
        console.error(`Error getting stats for member ${memberId}:`, error);
        return { tasksAssigned: 0, tasksCompleted: 0 };
    }
};

// @desc    Get all teams (Owned + Participating)
// @route   GET /api/team
// @access  Private
const getTeamMembers = asyncHandler(async (req, res) => {
    // 1. Migration Check: If User has legacy team data but no Team document, create one
    // We only do this logic if they have members in their legacy array.
    const user = await User.findById(req.user._id);
    const ownedTeamsCount = await Team.countDocuments({ owner: req.user._id });

    if (ownedTeamsCount === 0 && (user.teamMembers.length > 0 || user.role === 'team_head' || user.role === 'admin')) {
        // Create default team from legacy data
        // Check if there are members to migrate, or just create an empty team if they are head/admin
        await Team.create({
            name: user.teamName || 'My Team',
            description: user.teamDescription || 'Team managed by you',
            owner: user._id,
            members: user.teamMembers
        });
        // Clear legacy to avoid confusion? Optional. Keeping it safe for now.
    }

    // 2. Fetch Owned Teams
    const ownedTeams = await Team.find({ owner: req.user._id })
        .populate('members', 'name email role');

    // 3. Fetch Participating Teams
    const participatingTeams = await Team.find({ members: req.user._id })
        .populate('owner', 'name email')
        .populate('members', 'name email role');

    const resultTeams = [];

    // Process Owned Teams
    for (const team of ownedTeams) {
        const membersWithStats = await Promise.all(
            team.members.filter(m => m !== null).map(async (m) => {
                const stats = await getMemberStats(m._id);
                return {
                    _id: m._id,
                    name: m.name,
                    email: m.email,
                    role: m.role,
                    tasksAssigned: stats.tasksAssigned,
                    tasksCompleted: stats.tasksCompleted
                };
            })
        );

        // Add team owner/head to the members list with their stats
        try {
            const ownerUser = await User.findById(team.owner).select('name email role');
            if (ownerUser) {
                const ownerStats = await getMemberStats(team.owner);
                const ownerData = {
                    _id: ownerUser._id,
                    name: ownerUser.name,
                    email: ownerUser.email,
                    role: ownerUser.role || 'team_head',
                    tasksAssigned: ownerStats.tasksAssigned,
                    tasksCompleted: ownerStats.tasksCompleted,
                    isOwner: true // Flag to identify owner in frontend
                };

                // Check if owner is not already in members array (avoid duplicates)
                const ownerAlreadyIncluded = membersWithStats.some(m => m._id.toString() === team.owner.toString());
                if (!ownerAlreadyIncluded) {
                    membersWithStats.unshift(ownerData); // Add at the beginning
                }
            }
        } catch (error) {
            console.error('Error adding team owner stats:', error);
        }

        resultTeams.push({
            id: team._id.toString(),
            name: team.name,
            description: team.description,
            members: membersWithStats,
            isOwner: true,
            ownerName: 'You'
        });
    }

    // Process Participating Teams
    for (const team of participatingTeams) {
        const membersWithStats = await Promise.all(
            team.members.filter(m => m !== null).map(async (m) => {
                const stats = await getMemberStats(m._id);
                return {
                    _id: m._id,
                    name: m.name,
                    email: m.email,
                    role: m.role,
                    tasksAssigned: stats.tasksAssigned,
                    tasksCompleted: stats.tasksCompleted
                };
            })
        );

        resultTeams.push({
            id: team._id.toString(),
            name: team.name,
            description: team.description,
            members: membersWithStats,
            isOwner: false,
            ownerName: team.owner?.name || team.owner?.email || 'Unknown'
        });
    }

    res.json(resultTeams);
});

// @desc    Create a new team
// @route   POST /api/team/create
// @access  Private (Team Head only)
const createNewTeam = asyncHandler(async (req, res) => {
    const { name, description } = req.body;

    if (!name) {
        res.status(400);
        throw new Error('Team name is required');
    }

    const team = await Team.create({
        name,
        description: description || '',
        owner: req.user._id,
        members: []
    });

    res.status(201).json(team);
});

// @desc    Add member to a specific team
// @route   POST /api/team
// @access  Private (Owner only)
// Note: Route is still /api/team for backwards compatibility with "invite" feature if desired,
// but we check params carefully.
const addTeamMember = asyncHandler(async (req, res) => {
    const { email, teamId } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Please provide an email');
    }

    let targetTeam;

    // If teamId is provided, find that team
    if (teamId) {
        targetTeam = await Team.findOne({ _id: teamId, owner: req.user._id });
    } else {
        // Fallback: If no teamId (legacy call), use the first owned team
        // This keeps backward compatibility with the frontend 'addTeamMember' if it wasn't validly updated
        targetTeam = await Team.findOne({ owner: req.user._id });

        // If still no team (e.g. migration hasn't run or first time), create one
        if (!targetTeam) {
            targetTeam = await Team.create({
                name: 'My Team',
                description: 'Team managed by you',
                owner: req.user._id,
                members: []
            });
        }
    }

    if (!targetTeam) {
        res.status(404);
        throw new Error('Team not found or you are not the owner');
    }

    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
        res.status(404);
        throw new Error('User not found with that email. They must register first.');
    }

    if (userToAdd._id.equals(req.user._id)) {
        res.status(400);
        throw new Error('You cannot add yourself to your team');
    }

    if (targetTeam.members.includes(userToAdd._id)) {
        res.status(400);
        throw new Error('User already in this team');
    }

    targetTeam.members.push(userToAdd._id);
    await targetTeam.save();

    // Trigger Notification for the team
    const io = req.app.get('socketio');
    const recipientIds = [...targetTeam.members, targetTeam.owner]
        .map(id => id.toString())
        .filter(id => id !== req.user._id.toString()); // Don't notify the one who added

    if (recipientIds.length > 0) {
        await createNotifications(recipientIds, {
            title: 'New Team Member',
            description: `${userToAdd.name} has joined the team "${targetTeam.name}"`,
            type: 'team_update',
            sender: req.user._id,
            link: '/team'
        }, io);
    }

    // Log Activity
    await Activity.create({
        teamOwner: req.user._id,
        team: targetTeam._id,
        text: `Added ${userToAdd.name} to team ${targetTeam.name}`,
        type: 'member_add'
    });

    // Return the updated member list for this team to update frontend
    const populatedTeam = await Team.findById(targetTeam._id).populate('members', 'name email role');

    const updatedMembers = await Promise.all(populatedTeam.members.map(async m => {
        const stats = await getMemberStats(m._id);
        return {
            _id: m._id,
            name: m.name,
            email: m.email,
            role: m.role,
            tasksAssigned: stats.tasksAssigned,
            tasksCompleted: stats.tasksCompleted
        };
    }));

    res.status(200).json(updatedMembers);
});

// @desc    Remove team member
// @route   DELETE /api/team/:teamId/member/:memberId
const removeTeamMember = asyncHandler(async (req, res) => {
    const { teamId, memberId } = req.params;

    if (!teamId || !memberId) {
        res.status(400);
        throw new Error('Invalid request parameters');
    }

    const team = await Team.findOne({ _id: teamId, owner: req.user._id });

    if (!team) {
        res.status(404);
        throw new Error('Team not found or you are not the owner');
    }

    if (!team.members.includes(memberId)) {
        res.status(404);
        throw new Error('Member not found in this team');
    }

    team.members = team.members.filter(id => id.toString() !== memberId);
    await team.save();

    // Trigger Notification for the remaining team
    const io = req.app.get('socketio');
    const recipientIds = [...team.members, team.owner]
        .map(id => id.toString())
        .filter(id => id !== req.user._id.toString());

    if (recipientIds.length > 0) {
        await createNotifications(recipientIds, {
            title: 'Team Update',
            description: `A member was removed from the team "${team.name}"`,
            type: 'team_update',
            sender: req.user._id,
            link: '/team'
        }, io);
    }

    await Activity.create({
        teamOwner: req.user._id,
        team: team._id,
        text: `Removed member from team ${team.name}`,
        type: 'member_remove'
    });

    return res.status(200).json({ id: memberId, teamId: team._id });
});

// @desc    Update team details (name, description)
// @route   PUT /api/team/:id/details <-- New specific
// @route   PUT /api/team             <-- Old general
const updateTeamDetails = asyncHandler(async (req, res) => {
    const { name, description, teamId } = req.body; // Expect teamId in body if specific

    let team;
    if (teamId) {
        team = await Team.findOne({ _id: teamId, owner: req.user._id });
    } else {
        // Fallback to first team
        team = await Team.findOne({ owner: req.user._id });
    }

    if (!team) {
        // If wanting to create, use createNewTeam.
        res.status(404);
        throw new Error('Team not found');
    }

    if (name) team.name = name;
    if (description !== undefined) team.description = description;

    await team.save();

    res.json({
        teamName: team.name, // Return unified format if needed by frontend
        teamDescription: team.description,
        id: team._id
    });
});

// @desc    Get team activity
// @route   GET /api/team/activity/:teamId
// @access  Private
const getTeamActivity = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    // Verify the user is part of this team (either owner or member)
    const team = await Team.findById(teamId);
    if (!team) {
        // Fallback check if it was a user ID (old code passed teamId as userId sometimes)
        // But new model has Team._id.
        // If migration happened, teamId should be Team ID.
        res.status(404);
        throw new Error('Team not found');
    }

    const isOwner = team.owner.toString() === req.user._id.toString();
    const isMember = team.members.includes(req.user._id);

    if (!isOwner && !isMember) {
        res.status(401);
        throw new Error('Not authorized to view this team\'s activity');
    }

    // Prefer querying by specific Team ID if data exists, else fallback to owner for legacy
    // Using $or to catch both new activities (with team field) and old ones (owner based)
    // Filter strictly by owner if no team field to prevent cross-leakage is hard if only owner exists
    // But we added 'team' field to model now.

    const activities = await Activity.find({
        $or: [
            { team: teamId }, // New standard
            { teamOwner: team.owner, team: { $exists: false } } // Fallback to owner ONLY if team not set (legacy)
        ]
    })
        .sort({ createdAt: -1 })
        .limit(20);

    res.json(activities);
});

// @desc    Delete a team
// @route   DELETE /api/team/:teamId
// @access  Private (Owner only)
const deleteTeam = asyncHandler(async (req, res) => {
    const { teamId } = req.params;

    const team = await Team.findOne({ _id: teamId, owner: req.user._id });

    if (!team) {
        res.status(404);
        throw new Error('Team not found or you are not the owner');
    }

    // Optional: Check if it's the last team? 
    // Or just allow deletion. If they delete all, they get empty view handled by frontend/getMembers

    await team.deleteOne();

    // Also remove associated activities? 
    await Activity.deleteMany({ team: teamId });

    res.status(200).json({ id: teamId, message: 'Team deleted' });
});

export { getTeamMembers, createNewTeam, addTeamMember, removeTeamMember, getTeamActivity, updateTeamDetails, deleteTeam };
