import { Team } from "../models/Team";
import { Player } from "../models/Player";
import { User } from "../models/User";
import mongoose from "mongoose";
import { PLAYERS_DATA } from "../constants/players";
import { Request, Response } from "express";

export const updateTeamName = async (req: Request, res: Response) => {
    try {
        const { teamName } = req.body;
        const userId = req.user?.userId;

        // Validate input
        if (!teamName || teamName.trim().length < 3 || teamName.trim().length > 30) {
            return res.status(400).json({
                message: "Team name must be between 3-30 characters"
            });
        }

        // Get user's team
        const user = await User.findById(userId).populate("team");
        if (!user || !user.team) {
            return res.status(404).json({ message: "Team not found" });
        }

        // Check if new name is already taken (case-insensitive)
        const teamExists = await Team.findOne({
            name: { $regex: new RegExp(`^${teamName.trim()}$`, "i") },
            _id: { $ne: user.team._id } // Exclude current team
        });

        if (teamExists) {
            return res.status(400).json({ message: "Team name is already taken" });
        }

        // Update team name
        const updatedTeam = await Team.findByIdAndUpdate(
            user.team._id,
            { name: teamName.trim() },
            { new: true }
        );

        res.json({
            message: "Team name updated successfully",
            team: {
                id: updatedTeam?._id,
                name: updatedTeam?.name
            }
        });
    } catch (error) {
        console.error("Update team name error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

export const createTeamForUser = async (userId: string) => {
    try {
        const team = await Team.create({
            owner: userId,
            budget: 5_000_000
        });

        const players = await Player.create([
            ...getPlayersByPosition("goalkeeper", 3, team._id),
            ...getPlayersByPosition("defender", 6, team._id),
            ...getPlayersByPosition("midfielder", 6, team._id),
            ...getPlayersByPosition("attacker", 5, team._id)
        ]);

        await Team.findByIdAndUpdate(team._id, {
            $push: { players: { $each: players.map(p => p._id) } }
        });

        await User.findByIdAndUpdate(userId, { team: team._id });

        console.log(`Team created for user ${userId}`);
    } catch (error) {
        console.error(`Team creation failed for user ${userId}:`, error);
        throw error;
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