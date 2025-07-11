import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';


declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email?: string;
                tokenVersion?: number;
            };
        }
    }
}

export const authenticateToken = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        const token = req.cookies?.accessToken ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            res.status(401).json({ message: "Authentication required" });
            return
        }


        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            email: string;
        };

        const user = await User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({ message: "Invalid token - user not found" });
            return
        }


        req.user = {
            userId: (user._id as unknown as string).toString(),
            email: user.email,
            tokenVersion: user.tokenVersion
        };

        next();
    } catch (error) {
        console.error("Authentication error:", error);

        if (error instanceof jwt.TokenExpiredError) {
            res.status(401).json({ message: "Token expired" });
            return
        }

        if (error instanceof jwt.JsonWebTokenError) {
            res.status(401).json({ message: "Invalid token" });
            return
        }

        res.status(500).json({ message: "Authentication failed" });
    }
};


export const checkTokenVersion = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {

        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }


        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return res.status(401).json({ message: "Session expired" });
        }


        const decodedRefresh = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_SECRET as string
        ) as { userId: string; tokenVersion: number };

        if (decodedRefresh.tokenVersion !== req.user.tokenVersion) {

            return res.status(401).json({
                message: "Session expired. Please login again."
            });
        }

        next();
    } catch (error) {
        console.error("Token version check error:", error);
        res.status(500).json({ message: "Session validation failed" });
    }
};