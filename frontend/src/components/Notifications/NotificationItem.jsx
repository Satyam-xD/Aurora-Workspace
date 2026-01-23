
import React from 'react';
import { Check, Trash2 } from 'lucide-react';

const NotificationItem = ({ notification, markAsRead, deleteNotification }) => {
    const Icon = notification.icon;

    return (
        <div
            onClick={() => markAsRead(notification.id)}
            className={`group relative p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${!notification.read
                ? 'bg-white dark:bg-gray-800 border-aurora-200 dark:border-aurora-900 shadow-sm'
                : 'bg-gray-50 dark:bg-gray-900/50 border-transparent hover:bg-white dark:hover:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
        >
            <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white shadow-sm ${notification.color}`}>
                    <Icon size={18} strokeWidth={2.5} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <h3 className={`text-sm font-semibold ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                            {notification.title}
                        </h3>
                        <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{notification.time}</span>
                    </div>
                    <p className={`text-sm mt-1 ${!notification.read ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-500'}`}>
                        {notification.description}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 top-1/2 transform -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg rounded-lg p-1 border border-gray-100 dark:border-gray-700 z-10">
                    {!notification.read && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-aurora-600 hover:bg-aurora-50 dark:hover:bg-aurora-900/20 rounded-md transition-colors"
                            title="Mark as read"
                        >
                            <Check size={16} />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            {!notification.read && (
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-2 h-2 bg-aurora-500 rounded-full"></div>
            )}
        </div>
    );
};

export default NotificationItem;
