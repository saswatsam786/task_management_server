import express, { Router } from "express";
import TaskController from "../controllers/TaskController";
import { verifyToken } from "../middlewares/VerifyToken";

class TasksRouter {
    private router: Router;

    constructor() {
        this.router = express.Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.post("/", verifyToken, TaskController.createTask);
        this.router.get("/", verifyToken, TaskController.getAllUserTasks);
        this.router.patch("/:taskId", verifyToken, TaskController.updateTask);
        this.router.delete("/:taskId", verifyToken, TaskController.deleteTask);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default TasksRouter;
