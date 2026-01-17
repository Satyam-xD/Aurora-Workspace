import mongoose from 'mongoose';

const activitySchema = mongoose.Schema({
    teamOwner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    text: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['member_add', 'member_remove', 'update'],
        default: 'update'
    }
}, {
    timestamps: true
});

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
