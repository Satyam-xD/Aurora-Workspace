import React from 'react';
import { useDocumentShare } from '../hooks/useDocumentShare/useDocumentShare';
import DocumentTable from '../components/DocumentShare/DocumentTable';
import CreateFolderModal from '../components/DocumentShare/CreateFolderModal';
import { Upload, Search, Folder, Clock, Plus, Trash2 } from 'lucide-react';

const DocumentShare = () => {
  const fileInputRef = React.useRef(null);
  const {
    documents,
    folders,
    currentFolder,
    setCurrentFolder,
    teams,
    selectedTeam,
    setSelectedTeam,
    loading,
    searchTerm,
    setSearchTerm,
    uploadFile,
    createFolder,
    renameFolder,
    deleteFolder,
    handleDelete,
    handleDownload,
    handleShare,
    getFileIcon,
    filteredDocs,
    filteredFolders
  } = useDocumentShare();

  const [isCreateFolderOpen, setIsCreateFolderOpen] = React.useState(false);

  const onFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      uploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 lg:p-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Documents</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and share files with your team.</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Team Selector */}
            <div className="relative">
              <select
                value={selectedTeam?.id || ''}
                onChange={(e) => {
                  const team = teams.find(t => t.id === e.target.value);
                  setSelectedTeam(team);
                  setCurrentFolder(null); // Reset to root
                }}
                className="appearance-none pl-3 pr-8 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer shadow-sm text-gray-700 dark:text-gray-300 min-w-[150px]"
              >
                {teams.map(team => (
                  <option key={team.id} value={team.id}>{team.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-aurora-500/20 focus:border-aurora-500 w-48 transition-all"
              />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={onFileSelect}
              className="hidden"
            />

            <button
              onClick={() => setIsCreateFolderOpen(true)}
              className="flex items-center px-4 py-2.5 bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-white rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <Plus size={18} className="mr-2" /> Folder
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center space-x-2 px-5 py-2.5 bg-aurora-600 text-white rounded-xl font-medium hover:bg-aurora-700 transition-colors shadow-lg shadow-aurora-500/20"
            >
              <Upload size={18} />
              <span>Upload</span>
            </button>
          </div>
        </div>

        {/* Create Folder Modal */}
        <CreateFolderModal
          isOpen={isCreateFolderOpen}
          onClose={() => setIsCreateFolderOpen(false)}
          onCreate={createFolder}
        />

        {/* Breadcrumbs */}
        <div className="flex items-center mb-6 text-sm text-gray-600 dark:text-gray-400">
          <button
            onClick={() => setCurrentFolder(null)}
            className={`hover:text-aurora-600 ${!currentFolder ? 'font-bold text-gray-900 dark:text-white' : ''}`}
          >
            Files
          </button>
          {currentFolder && (
            <>
              <span className="mx-2">/</span>
              <span className="font-bold text-gray-900 dark:text-white">{currentFolder.name}</span>
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6 min-w-0">

            {/* Folders Grid */}
            {filteredFolders.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {filteredFolders.map((folder, i) => (
                  <div
                    key={folder._id}
                    className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-aurora-500 dark:hover:border-aurora-500 transition-colors cursor-pointer group relative"
                    onClick={() => setCurrentFolder(folder)}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-blue-100 text-blue-600">
                      <Folder size={20} />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-aurora-600 dark:group-hover:text-aurora-400 transition-colors truncate">
                      {folder.name}
                    </h3>
                    {/* Admin Actions for Folder (Prevent propagation) */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteFolder(folder._id); }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                      >
                        <Trash2 size={12} className="text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Files Table */}
            <DocumentTable
              loading={loading}
              filteredDocs={filteredDocs}
              handleDelete={handleDelete}
              handleDownload={handleDownload}
              handleShare={handleShare}
              getFileIcon={getFileIcon}
            />

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity (Placeholder/Filtered) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Recent Uploads</h3>
              <div className="space-y-4">
                {documents.slice(0, 5).map((doc, i) => (
                  <div key={i} className="flex items-start space-x-3">
                    <div className="mt-0.5 p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <Clock size={14} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-900 dark:text-white">
                        <span className="font-medium">{doc.uploadedBy?.name || 'Unknown'}</span> uploaded {doc.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
                {documents.length === 0 && <p className="text-sm text-gray-500">No files yet.</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentShare;
