import { useState, useMemo, useEffect } from 'react';
import { useChatContext } from '../../context/ChatContext';
import { MessageCircle, Video, FileText, UserPlus, Calendar, CheckSquare, Clock, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const useNotifications = () => {
    const [filter, setFilter] = useState('all');
    const { chatsData, setActiveChat } = useChatContext();
    const navigate = useNavigate();

    // Generate notifications from unread chats
    const chatNotifications = useMemo(() => {
        if (!chatsData) return [];
        return Object.values(chatsData)
            .filter(chat => chat.unreadCount > 0)
            .map(chat => {
                const lastMsg = chat.messages[chat.messages.length - 1];
                return {
                    id: `chat-${chat.id}`,
                    chatId: chat.id,
                    type: 'message',
                    title: `New message from ${chat.name}`,
                    description: lastMsg ? lastMsg.text : 'You have a new message',
                    time: lastMsg ? new Date(lastMsg.fullTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                    read: false,
                    icon: MessageCircle,
                    color: 'bg-blue-500',
                    link: `/chat`
                };
            });
    }, [chatsData]);

    const [mockNotifications, setMockNotifications] = useState([
        {
            id: 1,
            type: 'message',
            title: 'New message from Satyam',
            description: 'Hey! Can we schedule a meeting for tomorrow?',
            time: '5m ago',
            read: false,
            icon: MessageCircle,
            color: 'bg-blue-500'
        },
        {
            id: 2,
            type: 'video',
            title: 'Video call invitation',
            description: 'Prachi invited you to join "Weekly Sync"',
            time: '15m ago',
            read: false,
            icon: Video,
            color: 'bg-fuchsia-500'
        },
        {
            id: 3,
            type: 'document',
            title: 'Document shared',
            description: 'Sneha shared "Project_Plan.pdf"',
            time: '1h ago',
            read: true,
            icon: FileText,
            color: 'bg-purple-500'
        },
        {
            id: 4,
            type: 'user',
            title: 'New team member',
            description: 'Parkhi joined your workspace',
            time: '2h ago',
            read: true,
            icon: UserPlus,
            color: 'bg-indigo-500'
        },
        {
            id: 5,
            type: 'calendar',
            title: 'Meeting reminder',
            description: 'Team standup in 30 minutes',
            time: '3h ago',
            read: false,
            icon: Calendar,
            color: 'bg-red-500'
        }
    ]);

    // Simulate real-time updates
    useEffect(() => {
        // Simulate a new task being assigned after 5 seconds
        const taskTimer = setTimeout(() => {
            const newTaskNotification = {
                id: Date.now(),
                type: 'task',
                title: 'New Task Assigned',
                description: 'You have been assigned to "Frontend Architecture"',
                time: 'Just now',
                read: false,
                icon: CheckSquare,
                color: 'bg-emerald-500'
            };
            setMockNotifications(prev => [newTaskNotification, ...prev]);
        }, 5000);

        // Simulate a deadline approaching after 10 seconds
        const deadlineTimer = setTimeout(() => {
            const deadlineNotification = {
                id: Date.now() + 1,
                type: 'deadline',
                title: 'Deadline Approaching',
                description: 'Task "Design System" is due in 2 hours',
                time: 'Just now',
                read: false,
                icon: AlertCircle,
                color: 'bg-amber-500'
            };
            setMockNotifications(prev => [deadlineNotification, ...prev]);
        }, 12000);

        return () => {
            clearTimeout(taskTimer);
            clearTimeout(deadlineTimer);
        };
    }, []);


    // Combine mock and real chat notifications
    const notifications = useMemo(() => {
        // Sort by time (approximated) - putting unread chat messages at the top usually
        return [...chatNotifications, ...mockNotifications];
    }, [chatNotifications, mockNotifications]);

    const markAsRead = (id) => {
        if (typeof id === 'string' && id.startsWith('chat-')) {
            const chatId = id.replace('chat-', '');
            setActiveChat(chatId);
            navigate('/chat');
            return;
        }
        setMockNotifications(mockNotifications.map(notif =>
            notif.id === id ? { ...notif, read: true } : notif
        ));
    };

    const markAllAsRead = () => {
        setMockNotifications(mockNotifications.map(notif => ({ ...notif, read: true })));
    };

    const deleteNotification = (id) => {
        if (typeof id === 'string' && id.startsWith('chat-')) {
            // Cannot delete chat notification easily, maybe just ignore
            return;
        }
        setMockNotifications(mockNotifications.filter(notif => notif.id !== id));
    };

    const filteredNotifications = useMemo(() => {
        return filter === 'all'
            ? notifications
            : filter === 'unread'
                ? notifications.filter(n => !n.read)
                : notifications;
    }, [notifications, filter]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return {
        filter,
        setFilter,
        notifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        filteredNotifications,
        unreadCount
    };
};
