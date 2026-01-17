import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

export const useTeamManagement = () => {
    const { user } = useAuth();

    // State management
    const [teams, setTeams] = useState([]);
    const [currentTeamId, setCurrentTeamId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Input States
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [hoveredMember, setHoveredMember] = useState(null);

    // Fetch Teams from Backend
    const fetchTeams = async () => {
        try {
            setLoading(true);
            const token = user?.token || JSON.parse(localStorage.getItem('user'))?.token; // Fallback directly to storage if context is lagging
            console.log('Fetching teams with token:', token ? 'Present' : 'Missing');

            const res = await fetch('/api/team', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();

            if (res.ok) {
                // Determine if data is array (new format) or something else
                // Controller now returns an array of team objects
                let fetchedTeams = Array.isArray(data) ? data : [];

                // If user has no teams, provide a default empty view? 
                // Or if controller ensures at least one?
                if (fetchedTeams.length === 0) {
                    // If purely empty, maybe default to a self-view
                    fetchedTeams = [{
                        id: 'default',
                        name: 'My View',
                        description: 'No teams found',
                        members: [],
                        isOwner: false
                    }];
                }

                setTeams(fetchedTeams);

                // Set current team preference
                // Try to keep selection if valid, else pick first
                if (currentTeamId) {
                    const stillExists = fetchedTeams.find(t => t.id === currentTeamId);
                    if (!stillExists) setCurrentTeamId(fetchedTeams[0].id);
                } else {
                    setCurrentTeamId(fetchedTeams[0]?.id);
                }
            } else {
                setError(data.message || 'Failed to fetch teams');
            }
        } catch (err) {
            console.error(err);
            setError('Network error fetching teams');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchTeams();
        }
    }, [user]);


    // Derived State
    const currentTeam = useMemo(() => teams.find(t => t.id === currentTeamId) || teams[0], [teams, currentTeamId]);
    const teamMembers = currentTeam?.members || [];

    // "Is Owner" defines if the current user can manage THIS specific team
    const isTeamOwner = currentTeam?.isOwner || false;

    // Global "Admin" status might still be useful, or we rely on isTeamOwner
    const isAdmin = user?.role === 'admin';

    // Filters
    const filteredMembers = useMemo(() => {
        return teamMembers.map(m => ({
            ...m,
            // Ensure numeric values for safety, but DO NOT mock random data
            tasksAssigned: m.tasksAssigned || 0,
            tasksCompleted: m.tasksCompleted || 0,
            productivity: m.productivity || 0
        })).filter(member =>
            (member.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (member.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [teamMembers, searchTerm]);

    // Stats
    const stats = useMemo(() => {
        const adminCount = teamMembers.filter(m => m.role === 'admin').length;
        const memberCount = teamMembers.length;
        const totalTasks = filteredMembers.reduce((acc, curr) => acc + curr.tasksAssigned, 0);
        const completedTasks = filteredMembers.reduce((acc, curr) => acc + curr.tasksCompleted, 0);

        // Calculate Average Productivity only if there are members with data
        // For now, if tasksAssigned > 0, we can calculate a simple productivity % (completed/assigned)
        // Or aggregate their 'productivity' field if it exists in future
        let avgProductivity = 0;
        if (totalTasks > 0) {
            avgProductivity = Math.round((completedTasks / totalTasks) * 100);
        }

        return {
            adminCount,
            memberCount,
            total: teamMembers.length,
            totalTasks,
            completedTasks,
            productivity: avgProductivity
        };
    }, [teamMembers, filteredMembers]);


    // Actions
    const handleInvite = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!inviteEmail.trim()) {
            setError('Please enter an email address');
            return;
        }

        if (!isTeamOwner) {
            setError('Only the team owner can invite members.');
            return;
        }

        setLoading(true);

        try {
            const token = user?.token;
            // Use currentTeamId to invite to specific team
            const res = await fetch('/api/team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: inviteEmail, teamId: currentTeamId })
            });
            const data = await res.json();

            if (res.ok) {
                // data is the updated members list
                // Update local state
                setTeams(prev => prev.map(t => {
                    if (t.id === currentTeamId) {
                        return {
                            ...t, members: data.map(m => ({
                                ...m,
                                tasksAssigned: m.tasksAssigned || 0,
                                tasksCompleted: m.tasksCompleted || 0
                            }))
                        };
                    }
                    return t;
                }));

                setSuccess(`Invited ${inviteEmail} successfully!`);
                setInviteEmail('');
            } else {
                setError(data.message || 'Failed to invite member');
            }
        } catch (err) {
            setError('Network error during invite');
        } finally {
            setLoading(false);
            // Auto clear success
            setTimeout(() => setSuccess(''), 3000);
        }
    };

    const handleRemoveMember = async (memberId) => {
        if (!isTeamOwner) {
            alert("Only the team owner can remove members.");
            return;
        }

        if (window.confirm('Are you sure you want to remove this member?')) {
            try {
                const token = user?.token;
                const res = await fetch(`/api/team/${memberId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.ok) {
                    setTeams(prev => prev.map(t => {
                        if (t.id === currentTeamId) {
                            return { ...t, members: t.members.filter(m => m._id !== memberId) };
                        }
                        return t;
                    }));
                    setSuccess('Member removed from team.');
                } else {
                    const data = await res.json();
                    setError(data.message || 'Failed to remove member');
                }
            } catch (err) {
                setError('Network error removing member');
            } finally {
                setTimeout(() => setSuccess(''), 3000);
            }
        }
    };

    // Create NEW Team
    const createTeam = async (teamName) => {
        if (!teamName || !teamName.trim()) return;

        try {
            const token = user?.token;

            const res = await fetch('/api/team/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: teamName, description: 'New Team' })
            });
            const data = await res.json();

            if (res.ok) {
                const newTeam = {
                    id: data._id,
                    name: data.name,
                    description: data.description,
                    members: [],
                    isOwner: true
                };
                setTeams(prev => [...prev, newTeam]);
                setCurrentTeamId(newTeam.id);
                setSuccess('New team created successfully');
            } else {
                setError(data.message || 'Failed to create team');
            }
        } catch (err) {
            setError('Network error creating team');
        }
    };

    // Update Team Details (rename, description)
    const updateTeamDetails = async (name, description) => {
        if (!isTeamOwner) {
            setError("Only team owner can update details");
            return;
        }

        try {
            const token = user?.token;
            const res = await fetch('/api/team', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, description, teamId: currentTeamId })
            });
            const data = await res.json();

            if (res.ok) {
                setTeams(prev => prev.map(t => {
                    if (t.id === currentTeamId) {
                        return { ...t, name: data.teamName, description: data.teamDescription };
                    }
                    return t;
                }));
                // Silent update for better UX on rename
            } else {
                setError(data.message || 'Failed to update team details');
            }
        } catch (err) {
            setError('Network error updating team');
        } finally {
            setTimeout(() => setSuccess(''), 3000);
        }
    };




    // Delete Team
    const deleteTeam = async (teamId) => {
        // eslint-disable-next-line no-restricted-globals
        if (!isTeamOwner) return;
        // eslint-disable-next-line no-restricted-globals
        if (!window.confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;

        try {
            const token = user?.token;
            const res = await fetch(`/api/team/delete/${teamId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                // Remove from local state
                const updatedTeams = teams.filter(t => t.id !== teamId);
                setTeams(updatedTeams);
                setSuccess("Team deleted successfully");

                // If deleted current team, switch
                if (currentTeamId === teamId) {
                    setCurrentTeamId(updatedTeams[0]?.id || null);
                }
            } else {
                const data = await res.json();
                setError(data.message || 'Failed to delete team');
            }
        } catch (err) {
            setError('Network error deleting team');
        }
    };

    return {
        user,
        isAdmin, // Kept for legacy components checking role directly
        isTeamOwner, // New: precise permission
        inviteEmail, setInviteEmail,
        inviteName, setInviteName,
        searchTerm, setSearchTerm,
        error, setError,
        success, setSuccess,
        loading,
        hoveredMember, setHoveredMember,
        teamMembers,
        filteredMembers,
        stats,
        teams,
        currentTeam,
        setCurrentTeamId,
        createTeam,
        handleInvite,
        handleRemoveMember,
        updateTeamDetails,
        deleteTeam
    };
};
