
import React from 'react';

const NotificationFilters = ({ filter, setFilter, unreadCount }) => {
    return (
        <div className="flex space-x-3 mb-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-1.5 rounded-2xl border border-gray-200/50 dark:border-gray-700/50 shadow-sm w-fit">
            <button
                onClick={() => setFilter('all')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${filter === 'all'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-md ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                    }`}
            >
                All
            </button>
            <button
                onClick={() => setFilter('unread')}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${filter === 'unread'
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-white shadow-md ring-1 ring-black/5 dark:ring-white/10'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50/50 dark:hover:bg-gray-700/50'
                    }`}
            >
                <span>Unread</span>
                {unreadCount > 0 && (
                    <span className={`px-1.5 py-0.5 rounded-md text-xs transition-colors ${filter === 'unread'
                            ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                        }`}>
                        {unreadCount}
                    </span>
                )}
            </button>
        </div>
    );
};

export default NotificationFilters;
