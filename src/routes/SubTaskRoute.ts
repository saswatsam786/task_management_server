import express, { Router } from "express";
import SubTaskController from "../controllers/SubTaskController";
import { verifyToken } from "../middlewares/VerifyToken";

class SubTaskRouter {
    public router: Router;

    constructor() {
        this.router = express.Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.post("/", verifyToken, SubTaskController.createSubTask);
        this.router.get("/", verifyToken, SubTaskController.getAllUserSubTasks);
        this.router.patch("/:subtaskId", verifyToken, SubTaskController.updateSubTask);
        this.router.delete("/:subtaskId", verifyToken, SubTaskController.deleteSubTask);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default SubTaskRouter;
