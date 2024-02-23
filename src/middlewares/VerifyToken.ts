import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { createError } from "../utilities/Error";

export interface CustomRequest extends Request {
    user?: {
        id: string;
    };
}

export const verifyToken = async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        if (!req.headers.authorization) {
            return next(createError(401, "You are not authenticated!"));
        }

        // Get the token from the header
        const token: string = req.headers.authorization.split(" ")[1];

        // Check if token exists
        if (!token) return next(createError(401, "You are not authenticated!"));

        const decode: any = jwt.verify(token, process.env.JWT as string);
        req.user = decode;
        next();
    } catch (error) {
        return next(createError(402, (error as Error).message));
    }
};
