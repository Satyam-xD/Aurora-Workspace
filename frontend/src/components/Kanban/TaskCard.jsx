import React from 'react';
import { Edit, Trash2, Tag, Clock, Calendar } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

const PRIORITY_STYLES = {
    high: {
        badge: 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
        glow: 'hover:shadow-red-500/10',
    },
    medium: {
        badge: 'bg-orange-100 dark:bg-orange-900/40 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300',
        glow: 'hover:shadow-orange-500/10',
    },
    low: {
        badge: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
        glow: 'hover:shadow-blue-500/10',
    },
};

const TaskCard = React.memo(({ task, index, onEdit, onDelete }) => {
    const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`group bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transition-all relative overflow-hidden ${snapshot.isDragging
                            ? 'shadow-xl scale-105 rotate-2 z-50 ring-2 ring-blue-400 cursor-grabbing'
                            : 'hover:border-blue-400 dark:hover:border-blue-500 hover:-translate-y-1 hover:shadow-lg cursor-grab ' + style.glow
                        }`}
                    style={provided.draggableProps.style}
                >
                    {/* Header with Priority and Actions */}
                    <div className="flex justify-between items-start mb-3 relative z-10">
                        <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-wider border shadow-sm ${style.badge}`}>
                            {task.priority}
                        </span>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(task);
                                }}
                                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Edit task"
                            >
                                <Edit size={14} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(task._id);
                                }}
                                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Delete task"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    {/* Task Title */}
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-2 leading-snug break-words">
                        {task.title}
                    </h4>

                    {/* Task Description */}
                    <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-3 font-medium leading-relaxed break-words">
                        {task.description}
                    </p>

                    {/* Tag and Due Date */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 mb-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                            <Tag size={11} className="text-gray-500 dark:text-gray-400" />
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                                {task.tag}
                            </span>
                        </div>
                        {task.dueDate && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${isOverdue
                                    ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                                }`}>
                                <Clock size={11} />
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                        )}
                    </div>

                    {/* Footer with Created Date and Assignee */}
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                            <Calendar size={10} />
                            <span>
                                {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                        </div>
                        {task.assignedTo && (
                            <div className="flex items-center gap-2 bg-indigo-100 dark:bg-indigo-900/40 pr-2 pl-1 py-1 rounded-full border border-indigo-200 dark:border-indigo-700">
                                <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[9px] text-white font-bold">
                                    {task.assignedTo.name?.[0].toUpperCase()}
                                </div>
                                <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 truncate max-w-[70px]">
                                    {task.assignedTo.name.split(' ')[0]}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Draggable>
    );
});

TaskCard.displayName = 'TaskCard';

export default TaskCard;
