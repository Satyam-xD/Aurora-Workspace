import React from 'react';
import TaskCard from './TaskCard';
import { Plus } from 'lucide-react';
import { Droppable } from '@hello-pangea/dnd';

const KanbanColumn = React.memo(({ title, items, status, onAdd, onEdit, onDelete, icon: Icon }) => {
    const getColumnColors = () => {
        switch (title) {
            case 'To Do':
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/50',
                    border: 'border-gray-200 dark:border-gray-700',
                    iconBg: 'bg-gray-500',
                    countBg: 'bg-gray-100 dark:bg-gray-800',
                    countText: 'text-gray-700 dark:text-gray-300',
                };
            case 'In Progress':
                return {
                    bg: 'bg-blue-50 dark:bg-blue-900/20',
                    border: 'border-blue-200 dark:border-blue-700',
                    iconBg: 'bg-blue-500',
                    countBg: 'bg-blue-100 dark:bg-blue-900/30',
                    countText: 'text-blue-700 dark:text-blue-300',
                };
            case 'Done':
                return {
                    bg: 'bg-green-50 dark:bg-green-900/20',
                    border: 'border-green-200 dark:border-green-700',
                    iconBg: 'bg-green-500',
                    countBg: 'bg-green-100 dark:bg-green-900/30',
                    countText: 'text-green-700 dark:text-green-300',
                };
            default:
                return {
                    bg: 'bg-gray-50 dark:bg-gray-900/50',
                    border: 'border-gray-200 dark:border-gray-700',
                    iconBg: 'bg-gray-500',
                    countBg: 'bg-gray-100 dark:bg-gray-800',
                    countText: 'text-gray-700 dark:text-gray-300',
                };
        }
    };

    const colors = getColumnColors();

    return (
        <div className={`flex-1 min-w-[320px] max-w-[400px] w-full ${colors.bg} rounded-2xl p-4 flex flex-col h-full border ${colors.border}`}>
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${colors.iconBg} text-white shadow-sm`}>
                        {Icon && <Icon size={18} />}
                    </div>
                    <div className="flex flex-col">
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.countBg} ${colors.countText}`}>
                                {items.length}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                {items.length === 1 ? 'task' : 'tasks'}
                            </span>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => onAdd(status)}
                    className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
                    title="Add Task"
                >
                    <Plus size={18} />
                </button>
            </div>

            {/* Droppable Area */}
            <Droppable droppableId={status}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`flex-1 overflow-y-auto pr-2 pb-2 -mr-2 rounded-xl transition-colors ${snapshot.isDraggingOver ? 'bg-blue-100/50 dark:bg-blue-900/20' : ''
                            }`}
                        style={{ scrollbarWidth: 'thin' }}
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

                        {/* Empty State */}
                        {items.length === 0 && (
                            <div className="h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl flex flex-col items-center justify-center text-gray-400 space-y-3 m-1">
                                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                    <Plus size={24} className="opacity-50" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">No tasks</p>
                                    <button
                                        onClick={() => onAdd(status)}
                                        className="text-xs text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 mt-1 font-bold"
                                    >
                                        Add a task
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Droppable>
        </div>
    );
});

KanbanColumn.displayName = 'KanbanColumn';

export default KanbanColumn;
