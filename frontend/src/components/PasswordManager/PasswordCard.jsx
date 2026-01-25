import React from 'react';
import { Eye, EyeOff, Copy, Check, Globe, Edit, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const PasswordCard = ({ pwd, categories, showPassword, copiedId, handleOpenModal, handleDelete, handleCopy, togglePasswordVisibility }) => {
    const isVisible = showPassword[pwd._id];
    const isCopied = copiedId === pwd._id;
    const categoryInfo = categories.find(cat => cat.value === (pwd.category || 'login'));

    return (
        <motion.div
            whileHover={{ y: -4 }}
            className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-700/50 shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
        >
            {/* Background Gradient Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Header */}
            <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{pwd.title}</h3>
                    <div className="flex items-center gap-2">
                        {categoryInfo && (
                            <div className={`w-9 h-9 bg-gradient-to-br ${categoryInfo.color} rounded-xl flex items-center justify-center shadow-md`}>
                                {React.createElement(categoryInfo.icon, {
                                    size: 18,
                                    className: 'text-white',
                                    strokeWidth: 2.5
                                })}
                            </div>
                        )}
                        <span className="text-xs px-3 py-1.5 bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 text-gray-700 dark:text-gray-300 rounded-full font-bold border border-gray-300 dark:border-gray-600 shadow-sm">
                            {categoryInfo?.label || pwd.category}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleOpenModal(pwd)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors shadow-sm"
                        title="Edit"
                    >
                        <Edit size={16} />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => handleDelete(pwd._id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-xl transition-colors shadow-sm"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </motion.button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3 relative z-10">
                {/* URL */}
                {pwd.url && (
                    <div className="flex items-center gap-2 group/url p-2.5 rounded-xl bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200/50 dark:border-blue-700/50">
                        <Globe size={16} className="text-blue-500 dark:text-blue-400 flex-shrink-0" />
                        <a
                            href={pwd.url.startsWith('http') ? pwd.url : `https://${pwd.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex-1 truncate font-semibold"
                        >
                            {pwd.url}
                        </a>
                        <button
                            onClick={() => handleCopy(pwd.url, `${pwd._id}_url`)}
                            className="p-1.5 text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-lg transition-colors opacity-0 group-hover/url:opacity-100"
                            title="Copy URL"
                        >
                            {copiedId === `${pwd._id}_url` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                )}

                {/* Username */}
                <div className="flex items-center gap-2 group/username p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-20">Username</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1 truncate font-semibold">{pwd.username}</span>
                    <button
                        onClick={() => handleCopy(pwd.username, `${pwd._id}_username`)}
                        className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors opacity-0 group-hover/username:opacity-100"
                        title="Copy username"
                    >
                        {copiedId === `${pwd._id}_username` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>

                {/* Password */}
                <div className="flex items-center gap-2 group/password p-3 rounded-xl bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200/50 dark:border-indigo-700/50 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/30 dark:hover:to-purple-900/30 transition-colors">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider w-20">Password</span>
                    <span className="text-sm font-mono text-gray-900 dark:text-gray-100 flex-1 truncate font-semibold">
                        {isVisible ? pwd.password : '•'.repeat(12)}
                    </span>
                    <button
                        onClick={() => togglePasswordVisibility(pwd._id)}
                        className="p-1.5 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg transition-colors"
                        title={isVisible ? 'Hide password' : 'Show password'}
                    >
                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                        onClick={() => handleCopy(pwd.password, `${pwd._id}_password`)}
                        className="p-1.5 text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-lg transition-colors opacity-0 group-hover/password:opacity-100"
                        title="Copy password"
                    >
                        {copiedId === `${pwd._id}_password` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>

                {/* Notes */}
                {pwd.notes && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed">{pwd.notes}</p>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default PasswordCard;
