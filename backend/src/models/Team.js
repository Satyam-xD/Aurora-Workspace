import mongoose from 'mongoose';

const teamSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        default: 'New Team'
    },
    description: {
        type: String,
        default: ''
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true,
});

const Team = mongoose.model('Team', teamSchema);

export default Team;
