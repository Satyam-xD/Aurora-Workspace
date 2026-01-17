
import React from 'react';
import { useTeamManagement } from '../hooks/useTeamManagement/useTeamManagement';
import { Shield, ChevronDown, Plus, Check } from 'lucide-react';
import TeamStats from '../components/TeamManagement/TeamStats';
import InviteMember from '../components/TeamManagement/InviteMember';
import TeamList from '../components/TeamManagement/TeamList';

const TeamManagement = () => {
  const {
    user,
    isAdmin, // Kept for reference but using isTeamOwner for permissions
    isTeamOwner,
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
    handleInvite,
    handleRemoveMember,
    teams,
    currentTeam,
    setCurrentTeamId,
    createTeam,
    updateTeamDetails,
    deleteTeam,
    activities
  } = useTeamManagement();

  const [isTeamMenuOpen, setIsTeamMenuOpen] = React.useState(false);

  // If loading, maybe show a spinner, but for now we render through. 
  // If user is not logged in, auth context handles redirection usually.

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in space-y-8 relative z-0">

      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 right-10 w-96 h-96 bg-aurora-500/10 rounded-full blur-[100px] animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-200/50 dark:border-gray-700/50">
        <div>
          <div className="relative">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsTeamMenuOpen(!isTeamMenuOpen)}
                className="flex items-center space-x-3 text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-purple-600 to-violet-600 dark:from-white dark:via-purple-400 dark:to-violet-400 tracking-tight hover:opacity-80 transition-opacity"
              >
                <span>{currentTeam?.name || 'My Team'}</span>
                <ChevronDown size={32} className="text-gray-400" />
              </button>

              {/* Edit Team Name Button */}
              {isTeamOwner && (
                <button
                  onClick={() => {
                    const newName = prompt("Enter new team name:", currentTeam?.name);
                    if (newName && newName.trim()) {
                      // Rename action
                      // We need to import/use updateTeamDetails from the hook if available
                      // It IS available in the hook return
                      // Assuming destructured below:
                      updateTeamDetails(newName, currentTeam?.description);
                    }
                  }}
                  className="p-2 ml-2 text-gray-400 hover:text-indigo-500 transition-colors"
                  title="Rename Team"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
              )}
            </div>

            {/* Team Dropdown */}
            {isTeamMenuOpen && (
              <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-2 z-50 animate-fade-in">
                <div className="mb-2 px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-widest">Switch Team</div>
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => {
                      setCurrentTeamId(team.id);
                      setIsTeamMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left text-sm font-medium transition-colors ${currentTeam?.id === team.id
                      ? 'bg-aurora-50 dark:bg-aurora-900/30 text-aurora-600 dark:text-aurora-400'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <span>{team.name}</span>
                    {currentTeam?.id === team.id && <Check size={16} />}
                  </button>
                ))}

                {/* Create New Team Button */}
                {(isAdmin || isTeamOwner) && (
                  <div className="pt-2 mt-2 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => {
                        const teamName = prompt("Enter new team name:");
                        if (teamName) createTeam(teamName);
                        setIsTeamMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 rounded-xl text-left text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <Plus size={16} />
                      <span>Create New Team</span>
                    </button>

                    {isTeamOwner && teams.length > 1 && (
                      <button
                        onClick={() => {
                          deleteTeam(currentTeam.id);
                          setIsTeamMenuOpen(false);
                        }}
                        className="w-full flex items-center space-x-2 px-3 py-2 mt-1 rounded-xl text-left text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        <span>Delete Team</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-2">
            {!isTeamOwner && (
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 uppercase">View Only</span>
            )}
            <p className="text-gray-500 dark:text-gray-400 text-lg font-light">
              {currentTeam?.description || 'Manage your team members and performance.'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shadow-sm">
          <div className="flex -space-x-4 hover:space-x-1 transition-all">
            {teamMembers.slice(0, 5).map((m, i) => (
              <div key={i} className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold text-white bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md transition-all hover:scale-110 hover:z-10">
                {m.name?.[0]?.toUpperCase() || m.email[0].toUpperCase()}
              </div>
            ))}
            {teamMembers.length > 5 && (
              <div className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 shadow-md z-10">
                +{teamMembers.length - 5}
              </div>
            )}
          </div>
          <div className="pl-2 border-l border-gray-200 dark:border-gray-700 ml-4">
            <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Active</span>
            <span className="font-bold text-gray-900 dark:text-white">{teamMembers.length} Members</span>
          </div>
        </div>
      </div>

      {/* Dashboard Stats Area */}
      <TeamStats stats={stats} activities={activities} />

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left: Invite Panel - ONLY IF OWNER */}
        {isTeamOwner && (
          <div className="xl:col-span-1">
            <InviteMember
              inviteEmail={inviteEmail}
              setInviteEmail={setInviteEmail}
              inviteName={inviteName}
              setInviteName={setInviteName}
              handleInvite={handleInvite}
              loading={loading}
              error={error}
              success={success}
            />
          </div>
        )}

        {/* Right: Member List - Full width if not owner */}
        <div className={isTeamOwner ? "xl:col-span-2" : "xl:col-span-3"}>
          <TeamList
            filteredMembers={filteredMembers}
            teamMembers={teamMembers}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            hoveredMember={hoveredMember}
            setHoveredMember={setHoveredMember}
            handleRemoveMember={isTeamOwner ? handleRemoveMember : undefined} // Pass undefined if not owner to disable
          />
        </div>
      </div>
    </div>
  );
};

export default TeamManagement;
