
import React from 'react';
import { Lock, Eye, EyeOff, Copy, Check, Globe, Edit, Trash2 } from 'lucide-react';



const PasswordCard = ({ pwd, categories, showPassword, copiedId, handleOpenModal, handleDelete, handleCopy, togglePasswordVisibility }) => {
    const isVisible = showPassword[pwd._id];
    const isCopied = copiedId === pwd._id;
    const categoryInfo = categories.find(cat => cat.value === (pwd.category || 'login'));

    return (
        <div className="glass-card rounded-xl p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border border-white/50 dark:border-gray-700/50">
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{pwd.title}</h3>
                    <div className="flex items-center space-x-2 mb-2">
                        {categoryInfo && (
                            <div className={`w-8 h-8 bg-gradient-to-br ${categoryInfo.color} rounded-lg flex items-center justify-center shadow-md`}>
                                {React.createElement(categoryInfo.icon, {
                                    size: 16,
                                    className: 'text-white',
                                    strokeWidth: 2.5
                                })}
                            </div>
                        )}
                        <span className="text-xs px-2.5 py-1 bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 rounded-full font-medium border border-gray-200 dark:border-gray-600">
                            {categoryInfo?.label || pwd.category}
                        </span>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => handleOpenModal(pwd)}
                        className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Edit"
                    >
                        <Edit size={18} />
                    </button>
                    <button
                        onClick={() => handleDelete(pwd._id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {pwd.url && (
                    <div className="flex items-center space-x-2 group">
                        <Globe size={16} className="text-gray-400" />
                        <a
                            href={pwd.url.startsWith('http') ? pwd.url : `https://${pwd.url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline text-sm flex-1 truncate font-medium"
                        >
                            {pwd.url}
                        </a>
                        <button
                            onClick={() => handleCopy(pwd.url, `${pwd._id}_url`)}
                            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors opacity-0 group-hover:opacity-100"
                            title="Copy URL"
                        >
                            {copiedId === `${pwd._id}_url` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                        </button>
                    </div>
                )}

                <div className="flex items-center space-x-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 w-20">Username</span>
                    <span className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 truncate">{pwd.username}</span>
                    <button
                        onClick={() => handleCopy(pwd.username, `${pwd._id}_username`)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy username"
                    >
                        {copiedId === `${pwd._id}_username` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>

                <div className="flex items-center space-x-2 group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 w-20">Password</span>
                    <span className="text-sm font-mono text-gray-800 dark:text-gray-200 flex-1 truncate">
                        {isVisible ? pwd.password : '•'.repeat(12)}
                    </span>
                    <button
                        onClick={() => togglePasswordVisibility(pwd._id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                        title={isVisible ? 'Hide password' : 'Show password'}
                    >
                        {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                        onClick={() => handleCopy(pwd.password, `${pwd._id}_password`)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors opacity-0 group-hover:opacity-100"
                        title="Copy password"
                    >
                        {copiedId === `${pwd._id}_password` ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                </div>

                {pwd.notes && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 italic">{pwd.notes}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PasswordCard;
