import { Schema, Document, model } from "mongoose";
import { ITask } from "./Task"; // Assuming you have a Task model defined

interface ISubTask extends Document {
    taskId: ITask["_id"];
    status: 0 | 1;
    deleted_at: Date | null;
}

const subTaskSchema = new Schema<ISubTask>(
    {
        taskId: {
            type: Schema.Types.ObjectId,
            ref: "Task",
            required: true,
        },
        status: {
            type: Number,
            enum: [0, 1],
            default: 0,
        },
        deleted_at: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

const SubTaskModel = model<ISubTask>("SubTask", subTaskSchema);

export default SubTaskModel;
