import { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
    phoneNumber: number;
    priority: number;
}

const userSchema = new Schema<IUser>(
    {
        phoneNumber: {
            type: Number,
            required: true,
            unique: true,
        },
        priority: {
            type: Number,
            enum: [0, 1, 2],
            required: true,
        },
    },
    { timestamps: true }
);

const User = model<IUser>("User", userSchema);

export default User;
