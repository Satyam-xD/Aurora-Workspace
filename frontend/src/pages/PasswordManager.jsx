import React from 'react';
import { usePasswordManager } from '../hooks/usePasswordManager/usePasswordManager';
import PasswordCard from '../components/PasswordManager/PasswordCard';
import PasswordModal from '../components/PasswordManager/PasswordModal';
import { Lock, Plus, Search, Key, Calendar, Globe, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { PasswordGridSkeleton } from '../components/SkeletonLoader';

const PasswordManager = () => {
  const {
    passwords, searchTerm, setSearchTerm, showPassword, copiedId, isModalOpen, editingId, isLoading, formData, setFormData,
    filteredPasswords, groupedPasswords,
    handleOpenModal, handleCloseModal, handleSubmit, handleDelete, handleCopy, togglePasswordVisibility
  } = usePasswordManager();

  const categories = [
    { value: 'login', label: 'Login Credentials', icon: Key, color: 'from-blue-500 to-cyan-500' },
    { value: 'meeting', label: 'Meeting Links', icon: Calendar, color: 'from-teal-500 to-emerald-500' },
    { value: 'website', label: 'Website', icon: Globe, color: 'from-indigo-500 to-purple-500' },
    { value: 'other', label: 'Other', icon: Lock, color: 'from-slate-500 to-gray-500' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-indigo-950/30">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-[120px] animate-blob" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[700px] h-[700px] bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-[120px] animate-blob animation-delay-2000" />
        <div className="absolute top-[40%] left-[30%] w-[500px] h-[500px] bg-gradient-to-br from-purple-500/15 to-indigo-500/15 rounded-full blur-[100px] animate-blob animation-delay-4000" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                whileHover={{ scale: 1.05, rotate: 5 }}
                className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
              >
                <Shield className="text-white" size={32} strokeWidth={2.5} />
              </motion.div>
              <div>
                <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-gray-900 via-indigo-900 to-purple-900 dark:from-white dark:via-indigo-200 dark:to-purple-200 bg-clip-text text-transparent">
                  Password Vault
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1 font-medium">Securely manage your credentials</p>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleOpenModal()}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all"
            >
              <Plus size={20} strokeWidth={2.5} />
              <span>Add Entry</span>
            </motion.button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search passwords, usernames, websites..."
              className="w-full pl-12 pr-4 py-4 bg-white/60 dark:bg-gray-800/60 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 backdrop-blur-sm transition-all shadow-sm font-medium"
            />
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          {categories.map((cat, idx) => {
            const count = groupedPasswords[cat.value]?.length || 0;
            return (
              <motion.div
                key={cat.value}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + idx * 0.05 }}
                whileHover={{ y: -4 }}
                className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-5 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${cat.color} text-white shadow-md`}>
                    <cat.icon size={20} />
                  </div>
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{cat.label}</span>
                </div>
                <p className="text-3xl font-black text-gray-900 dark:text-white">{count}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Loading State */}
        {isLoading ? (
          <PasswordGridSkeleton />
        ) : (
          <>
            {/* Password Entries */}
            {filteredPasswords.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-xl rounded-2xl p-16 text-center border-2 border-dashed border-gray-300 dark:border-gray-700"
              >
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="text-indigo-500 dark:text-indigo-400" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {passwords.length === 0 ? 'Vault is Empty' : 'No Results Found'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                  {passwords.length === 0
                    ? 'Your vault is currently empty. Add your first password to get started.'
                    : `We couldn't find any entries matching "${searchTerm}". Try a different keyword.`}
                </p>
                {passwords.length === 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleOpenModal()}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-500/30 transition-all"
                  >
                    <Plus size={20} />
                    <span>Add First Password</span>
                  </motion.button>
                )}
              </motion.div>
            ) : (
              <div className="space-y-10">
                {Object.entries(groupedPasswords).map(([category, items]) => {
                  const categoryInfo = categories.find(cat => cat.value === category);
                  return (
                    <motion.div
                      key={category}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${categoryInfo?.color || 'from-gray-500 to-gray-600'} shadow-lg`}>
                          {categoryInfo?.icon && React.createElement(categoryInfo.icon, {
                            size: 24,
                            className: 'text-white'
                          })}
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {categoryInfo?.label || category}
                        </h2>
                        <span className="px-3 py-1 rounded-full bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold border border-gray-300 dark:border-gray-600 shadow-sm">
                          {items.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {items.map((pwd, idx) => (
                          <motion.div
                            key={pwd._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <PasswordCard
                              pwd={pwd}
                              categories={categories}
                              showPassword={showPassword}
                              copiedId={copiedId}
                              handleOpenModal={handleOpenModal}
                              handleDelete={handleDelete}
                              handleCopy={handleCopy}
                              togglePasswordVisibility={togglePasswordVisibility}
                            />
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

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
