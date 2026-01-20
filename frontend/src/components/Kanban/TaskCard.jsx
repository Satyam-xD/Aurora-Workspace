import React from 'react';
import { Edit, Trash2, Tag, Clock } from 'lucide-react';
import { Draggable } from '@hello-pangea/dnd';

const PRIORITY_STYLES = {
    high: {
        wrapper: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600',
        indicator: 'bg-red-500',
    },
    medium: {
        wrapper: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600',
        indicator: 'bg-orange-500',
    },
    low: {
        wrapper: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-600',
        indicator: 'bg-blue-500',
    },
};

const TaskCard = React.memo(({ task, index, onEdit, onDelete }) => {
    const style = PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium;

    return (
        <Draggable draggableId={task._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`group bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-blue-500/30 dark:hover:border-blue-500/30 transition-all duration-200 mb-3 relative overflow-hidden ${snapshot.isDragging ? 'shadow-2xl rotate-2 scale-105 z-50' : ''}`}
                    style={provided.draggableProps.style}
                >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.indicator}`}></div>

                    <div className="flex justify-between items-start mb-3 pl-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider border ${style.wrapper}`}>
                            {task.priority}
                        </span>
                        <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => onEdit(task)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-blue-600 transition-colors">
                                <Edit size={14} />
                            </button>
                            <button onClick={() => onDelete(task._id)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-red-600 transition-colors">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-1.5 pl-2 leading-snug break-words">{task.title}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 mb-4 pl-2 font-medium leading-relaxed break-words">{task.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-50 dark:border-gray-700/50 pl-2">
                        <div className="flex items-center px-2 py-1 rounded bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600/50">
                            <Tag size={10} className="text-gray-400 mr-1.5" />
                            <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300">{task.tag}</span>
                        </div>
                        {task.dueDate && (
                            <div className={`flex items-center text-[10px] font-medium ${new Date(task.dueDate) < new Date() ? 'text-red-500' : 'text-gray-400'}`}>
                                <Clock size={12} className="mr-1.5" />
                                <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            </div>
                        )}
                    </div>

                    <div className="pt-2 mt-2 border-t border-gray-50 dark:border-gray-700/50 pl-2 flex justify-between items-center">
                        <span className="text-[10px] text-gray-400">
                            Created {new Date(task.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        {task.assignedTo && (
                            <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/50 pr-2 pl-1 py-0.5 rounded-full">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-[8px] text-white font-bold">
                                    {task.assignedTo.name?.[0].toUpperCase()}
                                </div>
                                <span className="text-[10px] font-medium text-gray-600 dark:text-gray-300 truncate max-w-[60px]">
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

export default TaskCard;
