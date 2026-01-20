import React from 'react';
import { usePasswordManager } from '../hooks/usePasswordManager/usePasswordManager';
import PasswordCard from '../components/PasswordManager/PasswordCard';
import PasswordModal from '../components/PasswordManager/PasswordModal';
import { Lock, Plus, Search, Key, Calendar, Globe } from 'lucide-react';

const PasswordManager = () => {
  const {
    passwords, searchTerm, setSearchTerm, showPassword, copiedId, isModalOpen, editingId, isLoading, formData, setFormData,
    filteredPasswords, groupedPasswords,
    handleOpenModal, handleCloseModal, handleSubmit, handleDelete, handleCopy, togglePasswordVisibility
  } = usePasswordManager();

  const categories = [
    { value: 'login', label: 'Login Credentials', icon: Key, color: 'from-blue-500 to-cyan-500' },
    { value: 'meeting', label: 'Meeting Links', icon: Calendar, color: 'from-indigo-500 to-purple-500' },
    { value: 'website', label: 'Website', icon: Globe, color: 'from-fuchsia-500 to-pink-500' },
    { value: 'other', label: 'Other', icon: Lock, color: 'from-slate-500 to-gray-500' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in pb-20">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-aurora-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-aurora-500/20 animate-float">
              <Lock className="text-white" size={32} strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-aurora-600 to-purple-600 dark:from-white dark:via-aurora-400 dark:to-purple-400">
                Password Vault
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">Securely manage your credentials</p>
            </div>
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center space-x-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:scale-105 transition-all duration-200"
          >
            <Plus size={20} />
            <span>Add Entry</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search passwords, usernames, websites..."
            className="w-full pl-12 pr-4 py-4 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-aurora-500/50 focus:border-aurora-500 backdrop-blur-sm transition-all shadow-sm"
          />
        </div>
      </div>



      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 border-t-aurora-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* Password Entries */}
          {filteredPasswords.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 text-center border-dashed border-2 border-gray-300 dark:border-gray-700">
              <div className="w-20 h-20 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-gray-400" size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {passwords.length === 0 ? 'Vault is empty' : 'No results found'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                {passwords.length === 0
                  ? 'Your vault is currently empty. Add your first password to get started.'
                  : `We couldn't find any entries matching "${searchTerm}". Try a different keyword.`}
              </p>
              {passwords.length === 0 && (
                <button
                  onClick={() => handleOpenModal()}
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-aurora-500 to-purple-600 text-white px-8 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-aurora-500/20 transition-all duration-200"
                >
                  <Plus size={20} />
                  <span>Add First Password</span>
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-10">
              {Object.entries(groupedPasswords).map(([category, items]) => {
                const categoryInfo = categories.find(cat => cat.value === category);
                return (
                  <div key={category} className="animate-fade-in-up">
                    <div className="flex items-center space-x-3 mb-6">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${categoryInfo?.color || 'from-gray-500 to-gray-600'} shadow-md`}>
                        {categoryInfo?.icon && React.createElement(categoryInfo.icon, {
                          size: 20,
                          className: 'text-white'
                        })}
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {categoryInfo?.label || category}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-xs font-bold border border-gray-200 dark:border-gray-700">
                        {items.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {items.map(pwd => (
                        <PasswordCard
                          key={pwd._id}
                          pwd={pwd}
                          categories={categories}
                          showPassword={showPassword}
                          copiedId={copiedId}
                          handleOpenModal={handleOpenModal}
                          handleDelete={handleDelete}
                          handleCopy={handleCopy}
                          togglePasswordVisibility={togglePasswordVisibility}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <PasswordModal
        isModalOpen={isModalOpen}
        handleCloseModal={handleCloseModal}
        handleSubmit={handleSubmit}
        formData={formData}
        setFormData={setFormData}
        editingId={editingId}
        categories={categories}
      />
    </div>
  );
};

export default PasswordManager;
