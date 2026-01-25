
import React from 'react';
import { Check, Trash2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

const NotificationItem = ({ notification, markAsRead, deleteNotification }) => {
    const Icon = notification.icon;

    return (
        <div
            onClick={() => !notification.read && markAsRead(notification.id)}
            className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${!notification.read
                ? 'bg-white dark:bg-gray-800 border-indigo-100 dark:border-indigo-900/30 shadow-lg shadow-indigo-100/50 dark:shadow-none'
                : 'bg-white/50 dark:bg-gray-800/50 border-transparent hover:bg-white dark:hover:bg-gray-800 hover:border-gray-100 dark:hover:border-gray-700'
                }`}
        >
            {/* "New" Badge for unread items */}
            {!notification.read && (
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-xl z-20">
                    NEW
                </div>
            )}

            {!notification.read && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-500"></div>
            )}

            <div className="flex items-start gap-5 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-white shadow-md transition-transform group-hover:scale-105 ${notification.color}`}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex justify-between items-start gap-4">
                        <h3 className={`text-base font-bold truncate pr-8 ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                        </h3>
                    </div>
                    <p className={`text-sm mt-1 leading-relaxed ${!notification.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                        {notification.description}
                    </p>

                    <div className="flex items-center mt-3 text-xs font-medium text-gray-400 dark:text-gray-500 gap-1.5">
                        <Clock size={12} />
                        <span>{notification.time}</span>
                    </div>
                </div>

                {/* Actions - Always visible on mobile, hover on desktop */}
                <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 transform -translate-y-1/2">
                    {!notification.read && (
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                            }}
                            className="p-2 text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-xl transition-colors shadow-sm"
                            title="Mark as read"
                        >
                            <Check size={18} strokeWidth={2.5} />
                        </motion.button>
                    )}
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 bg-white dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-gray-100 dark:border-gray-600 rounded-xl transition-colors shadow-sm"
                        title="Delete"
                    >
                        <Trash2 size={18} />
                    </motion.button>
                </div>
            </div>
        </div>
    );
};

export default NotificationItem;
