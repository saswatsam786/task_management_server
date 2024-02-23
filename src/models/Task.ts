import { Schema, Document, model, PaginateModel } from "mongoose";
import mongoosePaginate from "mongoose-paginate-v2";
import { IUser } from "./User";

export interface ITask extends Document {
    title: string;
    description: string;
    dueDate: Date;
    priority: number;
    status: "TODO" | "IN_PROGRESS" | "DONE";
    userId: IUser["_id"];
    deleted_at: Date | null;
}

interface ITaskModel extends PaginateModel<ITask> {}

const taskSchema = new Schema<ITask>(
    {
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
        dueDate: {
            type: Date,
            required: true,
        },
        priority: {
            type: Number,
            required: true,
            enum: [0, 1, 2, 3],
            default: 0,
        },
        status: {
            type: String,
            enum: ["TODO", "IN_PROGRESS", "DONE"],
            default: "TODO",
        },
        userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        deleted_at: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

taskSchema.plugin(mongoosePaginate);

const TaskModel: ITaskModel = model<ITask>("Task", taskSchema) as ITaskModel;

export default TaskModel;
