import { Team } from '../models/Team';
import { Player } from '../models/Player';
import { User } from '../models/User';
import mongoose from 'mongoose';
import { PLAYERS_DATA } from '../constants/players';


export const createTeamForUser = async (userId: string, teamName: string) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {

        const team = await Team.create([{
            name: teamName,
            owner: userId,
            budget: 5_000_000
        }], { session });


        // const players = await Player.create(
        //     [
        //         ...Array(3).fill(null).map((_, i) => ({
        //             name: `Goalkeeper ${i + 1}`,
        //             position: 'goalkeeper',
        //             price: calculatePlayerPrice('goalkeeper'),
        //             team: team[0]._id
        //         })),
        //         ...Array(6).fill(null).map((_, i) => ({
        //             name: `Defender ${i + 1}`,
        //             position: 'defender',
        //             price: calculatePlayerPrice('defender'),
        //             team: team[0]._id
        //         })),
        //         ...Array(6).fill(null).map((_, i) => ({
        //             name: `Midfielder ${i + 1}`,
        //             position: 'midfielder',
        //             price: calculatePlayerPrice('midfielder'),
        //             team: team[0]._id
        //         })),
        //         ...Array(5).fill(null).map((_, i) => ({
        //             name: `Attacker ${i + 1}`,
        //             position: 'attacker',
        //             price: calculatePlayerPrice('attacker'),
        //             team: team[0]._id
        //         }))
        //     ],
        //     { session, ordered: true }
        // );
        const players = await Player.create(
            [
                ...getPlayersByPosition('goalkeeper', 3, team[0]._id),
                ...getPlayersByPosition('defender', 6, team[0]._id),
                ...getPlayersByPosition('midfielder', 6, team[0]._id),
                ...getPlayersByPosition('attacker', 5, team[0]._id)
            ],
            { session, ordered: true }
        );

        await Team.findByIdAndUpdate(
            team[0]._id,
            { $push: { players: { $each: players.map(p => p._id) } } },
            { session }
        );


        await User.findByIdAndUpdate(
            userId,
            { team: team[0]._id },
            { session }
        );

        await session.commitTransaction();
        console.log(`Team created for user ${userId}`);
    } catch (error) {
        await session.abortTransaction();
        console.error(`Team creation failed for user ${userId}:`, error);
        throw error;
    } finally {
        session.endSession();
    }
};

const calculatePlayerPrice = (position: string): number => {
    const basePrices: Record<string, number> = {
        goalkeeper: 500_000,
        defender: 400_000,
        midfielder: 600_000,
        attacker: 800_000
    };
    const variation = 0.8 + Math.random() * 0.4;
    return Math.round(basePrices[position] * variation);
};

function getPlayersByPosition(position: string, count: number, teamId: mongoose.Types.ObjectId) {
    const playersForPosition = PLAYERS_DATA[position as keyof typeof PLAYERS_DATA];


    const shuffled = [...playersForPosition].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);

    return selected.map((player, index) => ({
        name: player.name,
        position,
        price: calculatePlayerPrice(position),
        team: teamId,
        country: player.country,
        age: Math.floor(Math.random() * 10) + 18
    }));
}