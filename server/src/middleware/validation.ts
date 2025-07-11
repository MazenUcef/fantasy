import { NextFunction, Request, RequestHandler, Response } from "express";
import { body, validationResult } from "express-validator";



const handleValidationsErrors: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() })
        return;
    }
    next();
}


export const validateSignup: RequestHandler[] = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .trim()
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    handleValidationsErrors
];
export const validateTeamName: RequestHandler[] = [
    body('teamName')
        .trim()
        .notEmpty().withMessage('Team Nanem is required')
        .isLength({ min: 3, max: 30 }).withMessage("Team Name must be at least 3 characters and max 30 characters"),
    handleValidationsErrors
];

