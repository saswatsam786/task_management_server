import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";
import { CustomError, createError } from "../utilities/Error";
import User, { IUser } from "../models/User";

class UserController {
    public createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { phoneNumber, priority } = req.body;

            // Validate input
            if (phoneNumber === null || phoneNumber === undefined || priority === null || priority === undefined) {
                return next(createError(400, "Phone number and priority are required."));
            }

            const checkUser = await User.findOne({ phoneNumber: phoneNumber });
            if (checkUser) {
                return next(createError(400, "User already exists with this phone number!"));
            }

            // Create a new user with phoneNumber
            const newUser = new User({
                phoneNumber,
                priority,
            });

            // Save the user to the database
            const savedUser: IUser = await newUser.save();
            const token = jwt.sign({ id: savedUser._id }, process.env.JWT || "", {
                expiresIn: "9999 years",
            });

            res.status(201).json({ message: "User created successfully.", user: newUser, token });
        } catch (err) {
            return next(createError((err as CustomError).status || 500, (err as Error).message));
        }
    };

    public getUserDetails = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userId = req.params.id;

            // Validate user ID
            if (!userId) {
                return next(createError(400, "User ID is required."));
            }

            // Find user by ID
            const user: IUser | null = await User.findById(userId);

            // Check if user exists
            if (!user) {
                return next(createError(404, "User not found."));
            }

            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    };
}

export default new UserController();
