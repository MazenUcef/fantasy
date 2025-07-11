import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    position: {
        type: String,
        enum: ['goalkeeper', 'defender', 'midfielder', 'attacker'],
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    isOnTransferList: {
        type: Boolean,
        default: false
    },
    transferPrice: {
        type: Number,
        min: 0
    }
}, { timestamps: true });

export const Player = mongoose.model('Player', playerSchema);