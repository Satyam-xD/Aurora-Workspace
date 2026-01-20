import React from 'react';
import TaskCard from './TaskCard';
import { Plus, MoreHorizontal } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';

const KanbanColumn = React.memo(({ title, items, status, onAdd, onEdit, onDelete, icon: Icon }) => {
    return (
        <div
            className="flex-1 min-w-[320px] max-w-[400px] w-full bg-gray-50/50 dark:bg-gray-900/20 rounded-2xl p-4 flex flex-col h-full border border-gray-100 dark:border-gray-800 transition-colors duration-200"
        >
            <div className="flex items-center justify-between mb-6 px-1">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${title === 'To Do' ? 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' :
                        title === 'In Progress' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                            'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                        }`}>
                        {Icon && <Icon size={18} />}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                        <span className="text-xs text-gray-500 font-medium">{items.length} Tasks</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => onAdd(status)} className="p-1.5 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all" title="Add Task">
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto custom-scrollbar pr-2 pb-2 -mr-2 ${snapshot.isDraggingOver ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                    >
                        <div className="space-y-3 px-1">
                            {items.map((card, index) => (
                                <TaskCard
                                    key={card._id}
                                    task={card}
                                    index={index}
                                    onEdit={onEdit}
                                    onDelete={onDelete}
                                />
                            ))}
                            {provided.placeholder}
                        </div>

                        {items.length === 0 && (
                            <div className="h-40 border-2 border-dashed border-gray-200 dark:border-gray-700/50 rounded-xl flex flex-col items-center justify-center text-gray-400 space-y-3 m-1 bg-gray-50 dark:bg-gray-800/20">
                                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Plus size={20} className="opacity-50" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-medium">No tasks yet</p>
                                    <button onClick={() => onAdd(status)} className="text-xs text-blue-500 hover:text-blue-600 mt-1 font-medium">Create your first task</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    );
});

export default KanbanColumn;
