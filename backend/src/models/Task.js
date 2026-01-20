import mongoose from 'mongoose';

const taskSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // The member who is responsible for this task
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team', // The team this task belongs to
    },
    title: {
        type: String,
        required: [true, 'Please add a task title'],
    },
    description: {
        type: String,
    },
    status: {
        type: String, // 'To Do', 'In Progress', 'Done'
        required: true,
        default: 'To Do',
    },
    priority: {
        type: String, // 'low', 'medium', 'high'
        default: 'medium',
    },
    tag: {
        type: String, // 'Design', 'Development', etc.
        default: 'General',
    },
    dueDate: {
        type: Date,
    },
}, {
    timestamps: true,
});

const Task = mongoose.model('Task', taskSchema);

export default Task;
