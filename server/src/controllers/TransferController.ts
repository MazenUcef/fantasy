import { Request, Response } from "express";
import { Team } from "../models/Team";
import { Player } from "../models/Player";
import mongoose from "mongoose";
import { User } from "../models/User";
import { io } from "../index";
import { Notification } from "../models/Notification";

interface ITeam {
    _id: mongoose.Types.ObjectId;
    name: string;
    players: mongoose.Types.ObjectId[];
    budget: number;
    save(): Promise<ITeam>;
}

interface IPlayer {
    _id: mongoose.Types.ObjectId;
    name: string;
    position: string;
    team: mongoose.Types.ObjectId | ITeam;
    isOnTransferList: boolean;
    transferPrice?: number;
}

interface PlayerQuery {
    isOnTransferList: boolean;
    position?: string;
    name?: { $regex: string; $options: string };
    transferPrice?: {
        $gte?: number;
        $lte?: number;
    };
    team?: { $in: mongoose.Types.ObjectId[] };
}

export const getTransferList = async (req: Request, res: Response) => {
    try {
        const { position, minPrice, maxPrice, search, teamName } = req.query as {
            position?: string;
            minPrice?: string;
            maxPrice?: string;
            search?: string;
            teamName?: string;
        };

        const query: PlayerQuery = { isOnTransferList: true };

        if (position) query.position = position;
        if (search) query.name = { $regex: search, $options: "i" };

        if (minPrice || maxPrice) {
            query.transferPrice = {};
            if (minPrice) query.transferPrice.$gte = Number(minPrice);
            if (maxPrice) query.transferPrice.$lte = Number(maxPrice);
        }

        if (teamName) {
            const teams = await Team.find({
                name: { $regex: teamName, $options: "i" }
            }).select("_id").exec();

            query.team = { $in: teams.map(t => t._id) };
        }

        const players = await Player.find(query)
            .populate<{ team: ITeam }>({
                path: "team",
                select: "name"
            })
            .sort({ transferPrice: 1 })
            .exec();

        res.json(players);
    } catch (error: unknown) {
        console.error("Transfer list error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to get transfer list";
        res.status(500).json({ message: errorMessage });
    }
};

export const listPlayer = async (req: Request, res: Response) => {
    try {
        const { playerId, price } = req.body;
        const userId = req.user?.userId;

        if (!price || price <= 0) {
            throw new Error("Please provide a valid asking price");
        }

        const team = await Team.findOne({ owner: userId });
        if (!team) throw new Error("Team not found");

        const player = await Player.findOne({
            _id: playerId,
            team: team._id
        });

        if (!player) throw new Error("Player not found in your team");

        if (team.players.length <= 15) {
            throw new Error("Cannot list player - team must have at least 15 players");
        }

        player.isOnTransferList = true;
        player.transferPrice = price;
        await player.save();

        res.json({
            message: "Player listed on transfer market",
            player: {
                id: player._id,
                name: player.name,
                position: player.position,
                price: player.transferPrice
            }
        });
    } catch (error: unknown) {
        console.error("List player error:", error);
        let errorMessage = "An unknown error occurred while listing player";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(400).json({ message: errorMessage });
    }
};

export const unlistPlayer = async (req: Request, res: Response) => {
    try {
        const { playerId } = req.body;
        const userId = req.user?.userId;

        const team = await Team.findOne({ owner: userId });
        if (!team) throw new Error("Team not found");

        const player = await Player.findOne({
            _id: playerId,
            team: team._id
        });

        if (!player) throw new Error("Player not found in your team");

        player.isOnTransferList = false;
        player.transferPrice = undefined;
        await player.save();

        res.json({
            message: "Player removed from transfer market",
            player: {
                id: player._id,
                name: player.name
            }
        });
    } catch (error: unknown) {
        console.error("Unlist player error:", error);
        let errorMessage = "An unknown error occurred while unlisting player";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(400).json({ message: errorMessage });
    }
};

export const buyPlayer = async (req: Request, res: Response) => {
    try {
        const { playerId } = req.body;
        const userId = req.user?.userId;

        // 1. Validate player exists and is available for transfer
        const player = await Player.findById(playerId).populate("team");

        if (!player) {
            throw new Error("Player not found");
        }
        if (!player.isOnTransferList) {
            throw new Error("Player not available for transfer");
        }

        // 2. Validate buyer's team
        const buyerTeam = await Team.findOne({ owner: userId });
        if (!buyerTeam) throw new Error("Buyer team not found");

        // 3. Validate transaction conditions
        const price = Math.floor(player.transferPrice! * 0.95);

        if (buyerTeam.budget < price) {
            throw new Error(`Insufficient funds. Need $${price}, have $${buyerTeam.budget}`);
        }
        if (buyerTeam.players.length >= 25) {
            throw new Error("Your team already has the maximum of 25 players");
        }

        const sellerTeam = player.team as unknown as ITeam;
        if (sellerTeam.players.length <= 15) {
            throw new Error("Cannot complete transfer - selling team would have less than 15 players");
        }
        if (sellerTeam._id.equals(buyerTeam._id)) {
            throw new Error("Cannot buy your own player");
        }

        // 4. Get seller user
        const sellerUser = await User.findOne({ team: sellerTeam._id });
        if (!sellerUser) throw new Error("Seller user not found");

        // 5. Execute transfer
        buyerTeam.budget -= price;
        sellerTeam.budget += price;
        player.team = buyerTeam._id;
        player.isOnTransferList = false;
        player.transferPrice = undefined;

        await Promise.all([
            buyerTeam.save(),
            sellerTeam.save(),
            player.save(),
            Team.findByIdAndUpdate(buyerTeam._id, { $push: { players: player._id } }),
            Team.findByIdAndUpdate(sellerTeam._id, { $pull: { players: player._id } })
        ]);

        // 6. Create notification
        const notification = await Notification.create({
            user: sellerUser._id,
            message: `Your player ${player.name} has been sold to ${buyerTeam.name} for $${price}`,
            type: "transfer",
            metadata: {
                playerId: player._id,
                buyerTeamId: buyerTeam._id,
                amount: price
            }
        });

        // 7. Emit real-time events
        io.to(sellerUser._id.toString()).emit("player-sold", {
            message: `Your player ${player.name} has been sold!`,
            playerId: player._id,
            buyerTeam: buyerTeam.name,
            priceReceived: price,
            newBudget: sellerTeam.budget,
            notificationId: notification._id
        });

        res.json({
            message: "Transfer successful",
            player: {
                id: player._id,
                name: player.name,
                newTeam: buyerTeam._id,
                pricePaid: price
            },
            buyerBudget: buyerTeam.budget,
            sellerBudget: sellerTeam.budget
        });
    } catch (error: unknown) {
        console.error("Buy player error:", error);
        let errorMessage = "An unknown error occurred while buying player";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(400).json({ message: errorMessage });
    }
};

export const updateAskingPrice = async (req: Request, res: Response) => {
    try {
        const { playerId, newPrice } = req.body;
        const userId = req.user?.userId;

        if (!newPrice || newPrice <= 0) {
            throw new Error("Please provide a valid asking price");
        }

        // Verify player belongs to user's team and is listed
        const team = await Team.findOne({ owner: userId });
        if (!team) throw new Error("Team not found");

        const player = await Player.findOne({
            _id: playerId,
            team: team._id,
            isOnTransferList: true
        });

        if (!player) throw new Error("Player not found or not listed for transfer");

        player.transferPrice = newPrice;
        await player.save();

        res.json({
            message: "Asking price updated",
            player: {
                id: player._id,
                name: player.name,
                newPrice: player.transferPrice
            }
        });
    } catch (error: unknown) {
        console.error("Error while updating asking price:", error);
        let errorMessage = "An unknown error occurred";
        if (error instanceof Error) {
            errorMessage = error.message;
        }
        res.status(400).json({ message: errorMessage });
    }
};

export const getMyTeamPlayers = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        // Find the user's team and populate the players
        const team = await Team.findOne({ owner: userId })
            .populate<{ players: IPlayer[] }>("players")
            .exec();

        if (!team) {
            return res.status(404).json({ message: "Team not found" });
        }

        res.json({
            teamId: team._id,
            teamName: team.name,
            budget: team.budget,
            players: team.players.map(player => ({
                id: player._id,
                name: player.name,
                position: player.position,
                isOnTransferList: player.isOnTransferList,
                transferPrice: player.transferPrice
            }))
        });
    } catch (error: unknown) {
        console.error("Get team players error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to get team players";
        res.status(500).json({ message: errorMessage });
    }
};

export const getMyTeamPlayersForSale = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.userId;

        // Find the user's team and get only players listed for transfer
        const players = await Player.find({
            team: await Team.findOne({ owner: userId }).select("_id").exec(),
            isOnTransferList: true
        }).exec();

        res.json({
            players: players.map(player => ({
                id: player._id,
                name: player.name,
                position: player.position,
                transferPrice: player.transferPrice
            }))
        });
    } catch (error: unknown) {
        console.error("Get team players for sale error:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to get players for sale";
        res.status(500).json({ message: errorMessage });
    }
};