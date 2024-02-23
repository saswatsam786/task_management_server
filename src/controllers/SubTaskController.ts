import { Request, Response, NextFunction } from "express";
import { createError, CustomError } from "../utilities/Error";
import TaskModel from "../models/Task";
import SubTaskModel from "../models/SubTask";

export interface CustomRequest extends Request {
    user?: {
        id: string;
    };
}

class SubTaskController {
    public static createSubTask = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const { taskId } = req.body;
            const user = req.user;

            if (!user) {
                return next(createError(401, "User Not found!"));
            }

            // Validate input
            if (!taskId) {
                return next(createError(404, "Task ID is required."));
            }

            // Create a new sub task
            const newSubTask = new SubTaskModel({
                taskId,
            });

            // Save the sub task to the database
            const savedSubTask = await newSubTask.save();
            await SubTaskController.updateTaskStatus(taskId);

            res.status(201).json({
                message: "Sub Task created successfully.",
                subTask: savedSubTask,
            });
        } catch (err) {
            return next(createError((err as CustomError).status, (err as Error).message));
        }
    };

    public static getAllUserSubTasks = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const user = req.user;
            const { taskId } = req.query;

            if (!user) {
                return next(createError(401, "User Not found!"));
            }

            let filter = {};
            if (!taskId) {
                // Find all tasks associated with the user
                const tasks = await TaskModel.find({ userId: user.id });

                // Create a filter to get all subtasks associated with the user's tasks
                const taskIds = tasks.map((task) => task._id);
                filter = taskIds.length > 0 ? { taskId: { $in: taskIds }, deleted_at: null } : { deleted_at: null };
            } else {
                filter = { taskId, deleted_at: null };
            }

            const subTasks = await SubTaskModel.find(filter);

            return res.json({ subTasks });
        } catch (err) {
            return next(
                createError((err as CustomError).status || 500, (err as Error).message || "Internal Server Error")
            );
        }
    };

    public static updateSubTask = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const { subtaskId } = req.params;
            const { status } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return next(createError(404, "User not found!"));
            }

            // Validate input
            if (!subtaskId) {
                return next(createError(400, "Subtask ID is required."));
            }

            // Find the subtask by ID
            const subtask = await SubTaskModel.findById(subtaskId);

            // Check if the subtask exists
            if (!subtask) {
                return next(createError(404, "Subtask not found."));
            }

            if (subtask?.deleted_at != null) {
                return next(createError(400, `Subtask was deleted on: ${subtask?.deleted_at}`));
            }

            // Check if the subtask belongs to user
            const task = await TaskModel.findById(subtask.taskId);
            if (!task) {
                return next(createError(404, "Task not found for this subtask"));
            }
            if (task?.userId != userId) {
                return next(createError(401, "You can't update this subtask!"));
            }

            if (status !== undefined) {
                // Update the subtask status if provided
                subtask.status = status;
            }

            // Save the updated subtask
            await subtask.save();

            await SubTaskController.updateTaskStatus(subtask.taskId);

            res.json({ message: "Subtask updated successfully.", subtask });
        } catch (err) {
            return next(
                createError((err as CustomError).status || 500, (err as Error).message || "Internal Server Error")
            );
        }
    };

    public static deleteSubTask = async (req: CustomRequest, res: Response, next: NextFunction) => {
        try {
            const { subtaskId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return next(createError(404, "User not found!"));
            }

            // Validate input
            if (!subtaskId) {
                return next(createError(400, "Subtask ID is required."));
            }

            // Find the subtask by ID
            const subtask = await SubTaskModel.findById(subtaskId);

            // Check if the subtask exists
            if (!subtask) {
                return next(createError(404, "Subtask not found."));
            }

            if (subtask?.deleted_at != null) {
                return next(createError(400, `Subtask already deleted on: ${subtask?.deleted_at}`));
            }

            // Check if the subtask belongs to user
            const task = await TaskModel.findById(subtask.taskId);
            if (!task) {
                return next(createError(404, "Task not found for this subtask"));
            }
            if (task?.userId != userId) {
                return next(createError(401, "You can't delete this subtask!"));
            }

            // Perform soft delete by updating deleted_at field
            subtask.deleted_at = new Date();

            // Save the updated subtask
            await subtask.save();
            await SubTaskController.updateTaskStatus(subtask.taskId);

            res.json({ message: "Subtask deleted successfully.", subtask });
        } catch (err) {
            return next(
                createError((err as CustomError).status || 500, (err as Error).message || "Internal Server Error")
            );
        }
    };

    private static async updateTaskStatus(taskId: string) {
        try {
            const task = await TaskModel.findById(taskId);
            if (!task) {
                throw createError(404, "Task not found.");
            }

            const subtasks = await SubTaskModel.find({ taskId, deleted_at: null });

            if (subtasks.every((subtask) => subtask.status === 1)) {
                task.status = "DONE";
            } else if (subtasks.some((subtask) => subtask.status === 1)) {
                task.status = "IN_PROGRESS";
            } else {
                task.status = "TODO";
            }

            // Save the updated task status
            await task.save();
        } catch (error) {
            throw createError(
                (error as CustomError).status || 500,
                (error as Error).message || "Internal Server Error"
            );
        }
    }
}

export default SubTaskController;
