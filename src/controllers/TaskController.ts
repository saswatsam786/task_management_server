import { Request, Response, NextFunction } from "express";
import TaskModel from "../models/Task";
import { CustomError, createError } from "../utilities/Error";
import SubTaskModel from "../models/SubTask";

export interface CustomRequest extends Request {
    user?: {
        id: string;
    };
}

class TaskController {
    // CREATE NEW TASK FOR A USER
    public static async createTask(req: CustomRequest, res: Response, next: NextFunction) {
        try {
            const { title, description, dueDate } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return next(createError(404, "User not found!"));
            }

            // Validate input
            if (!title || !description || !dueDate) {
                return next(createError(400, "Title, description, and due date are required."));
            }

            // Create a new task
            const newTask = new TaskModel({
                title,
                description,
                dueDate,
                userId,
            });

            // Save the task to the database
            const savedTask = await newTask.save();

            return res.status(201).json({ message: "Task created successfully.", task: savedTask });
        } catch (err) {
            return next(createError((err as CustomError).status, (err as Error).message));
        }
    }

    // GET ALL USER TASKS WITH FILTERS AND PAGINATION
    public static async getAllUserTasks(req: CustomRequest, res: Response, next: NextFunction) {
        try {
            const userId = req.user?.id;

            const { priority, status, dueDate, page, limit } = req.query;

            if (!userId) {
                return next(createError(404, "User not found!"));
            }

            // Build filter object
            const filter = { userId, deleted_at: null } as any;
            if (priority) filter.priority = priority;
            if (status) filter.status = status;
            if (dueDate) filter.dueDate = { $lte: new Date(dueDate as string) }; // Assumed dueDate is in format 'YYYY-MM-DD'

            // Implement pagination
            const options = {
                page: parseInt(page as string, 10) || 1,
                limit: parseInt(limit as string, 10) || 10,
            };

            // Fetch tasks based on filter and pagination
            const tasks = await TaskModel.paginate(filter, options);

            return res.json(tasks);
        } catch (err) {
            return next(createError((err as CustomError).status, (err as Error).message));
        }
    }

    // UPDATE TASK dueDate AND status
    public static async updateTask(req: CustomRequest, res: Response, next: NextFunction) {
        try {
            const { taskId } = req.params;
            const { dueDate, status } = req.body;
            const userId = req.user?.id;

            if (!userId) {
                return next(createError(404, "User not found!"));
            }

            // Validate input
            if (!taskId) {
                return next(createError(400, "Task ID is required."));
            }

            // Find the task by ID
            const task = await TaskModel.findById(taskId);

            // Check if the task exists
            if (!task) {
                return next(createError(404, "Task not found."));
            }

            if (task?.deleted_at != null) {
                return next(createError(400, `Task was deleted on: ${task?.deleted_at}`));
            }

            //Check if task belongs to the user
            if (task.userId != userId) {
                return next(createError(401, "You can't update this task!"));
            }

            // Update dueDate and status if provided
            if (dueDate) {
                task.dueDate = dueDate;
            }
            if (status) {
                task.status = status;
            }

            // Save the updated task
            await task.save();

            res.json({ message: "Task updated successfully.", task });
        } catch (err) {
            return next(
                createError((err as CustomError).status || 500, (err as Error).message || "Internal Server Error")
            );
        }
    }

    // DELETE A TASK
    public static async deleteTask(req: CustomRequest, res: Response, next: NextFunction) {
        try {
            const { taskId } = req.params;
            const userId = req.user?.id;

            if (!userId) {
                return next(createError(404, "User not found!"));
            }

            // Validate input
            if (!taskId) {
                return next(createError(400, "Task ID is required."));
            }

            // Find the task by ID
            const task = await TaskModel.findById(taskId);

            // Check if the task exists
            if (!task) {
                return next(createError(404, "Task not found."));
            }

            if (task?.deleted_at != null) {
                return next(createError(400, `Task already deleted on: ${task?.deleted_at}`));
            }

            // Check if task belongs to user
            if (task?.userId != userId) {
                return next(createError(401, "You can't delete this task!"));
            }

            // Find and soft delete all associated subtasks
            const subtasks = await SubTaskModel.find({ taskId: task._id });

            for (const subtask of subtasks) {
                subtask.deleted_at = new Date();
                await subtask.save();
            }

            // Perform soft delete by updating deleted_at field
            task.deleted_at = new Date();

            // Save the updated task
            await task.save();

            return res.json({ message: "Task deleted successfully.", task });
        } catch (err) {
            return next(
                createError((err as CustomError).status || 500, (err as Error).message || "Internal Server Error")
            );
        }
    }
}

export default TaskController;
