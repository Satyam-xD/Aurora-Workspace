import express from 'express';
import { getTeamMembers, createNewTeam, addTeamMember, removeTeamMember, getTeamActivity, updateTeamDetails, deleteTeam } from '../controllers/teamController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Apply protect middleware to all routes
router.use(protect);

router.route('/')
    .get(getTeamMembers)
    .post(admin, addTeamMember) // Only team heads (admin) can add
    .put(admin, updateTeamDetails); // Update team details

router.post('/create', admin, createNewTeam);

router.route('/activity/:teamId')
    .get(getTeamActivity);

// Route for deleting a specific team
router.delete('/delete/:teamId', admin, deleteTeam);

// Remove member from specific team
router.delete('/:teamId/member/:memberId', admin, removeTeamMember);

export default router;
