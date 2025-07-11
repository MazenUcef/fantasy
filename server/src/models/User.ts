import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    },
    tokenVersion: {
        type: Number,
        default: 0
    },
    socketId: {
        type: String,
        default: null
    },
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);