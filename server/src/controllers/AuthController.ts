import { Request, RequestHandler, Response } from 'express';
import { User } from '../models/User';
import { Team } from '../models/Team';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/config';
import RabbitMQ from '../utils/RabbitMQ';


export const unifiedAuth = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const existingUser = await User.findOne({ email }).select('+password');

        if (existingUser) {

            const isMatch = await bcrypt.compare(password, existingUser.password);
            if (!isMatch) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }
            existingUser.tokenVersion += 1;

            const accessToken = jwt.sign(
                { userId: existingUser._id, email: existingUser.email },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            )


            const refreshToken = jwt.sign(
                { userId: existingUser._id, tokenVersion: existingUser.tokenVersion },
                process.env.JWT_REFRESH_SECRET as string,
                { expiresIn: "7d" }
            )

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict' as const,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict' as const,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })

            return res.json({
                user: {
                    id: existingUser._id,
                    email: existingUser.email,
                    hasTeam: !!existingUser.team
                },
                accessToken
            });
        } else {

            if (password.length < 8) {
                return res.status(400).json({ message: 'Password must be at least 8 characters' });
            }

            const hashedPassword = await bcrypt.hash(password, 12);
            const newUser = await User.create({ email, password: hashedPassword, tokenVersion: 0 });


            try {
                await RabbitMQ.publish('team_creation', {
                    userId: newUser._id.toString(),
                    email: newUser.email,
                });
            } catch (error) {
                console.error(`RabbitMQ publish attempt failed:`, error);
            }
            

            const accessToken = jwt.sign(
                { userId: newUser._id, email: newUser.email },
                process.env.JWT_SECRET as string,
                { expiresIn: "7d" }
            )


            const refreshToken = jwt.sign(
                { userId: newUser._id, tokenVersion: newUser.tokenVersion },
                process.env.JWT_REFRESH_SECRET as string,
                { expiresIn: "7d" }
            )

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict' as const,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })
            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict' as const,
                maxAge: 7 * 24 * 60 * 60 * 1000,
            })

            return res.status(201).json({
                user: {
                    id: newUser._id,
                    email: newUser.email,
                    hasTeam: false
                },
                accessToken,
                message: 'Team creation in progress'
            });
        }
    } catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};



export const refreshToken = async (req: Request, res: Response) => {
    try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token required" });
        }

        // Fix: Use JWT_REFRESH_SECRET instead of JWT_SECRET
        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { 
            userId: string; 
            tokenVersion: number 
        };

        const user = await User.findById(decoded.userId);
        if (!user || user.tokenVersion !== decoded.tokenVersion) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET as string,
            { expiresIn: '15m' }
        );

        return res.status(200).json({
            accessToken: newAccessToken
        });
    } catch (error) {
        console.error("Refresh token error:", error);

        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: "Refresh token expired" });
        }

        if (error instanceof jwt.JsonWebTokenError) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        return res.status(500).json({ message: "Internal server error" });
    }
};

export const SignOut: RequestHandler = async (req, res) => {
    try {
        const userId = req.user?.userId;
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $inc: { tokenVersion: 1 },
                $set: { socketId: null }
            })
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({ message: "Logged out successfully" });
    } catch (error) {
        console.error("Logout error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}