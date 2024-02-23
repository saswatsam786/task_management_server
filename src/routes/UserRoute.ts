import express, { Router } from "express";
import UserController from "../controllers/UserController";

class UserRouter {
    private router: Router;

    constructor() {
        this.router = express.Router();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.post("/register", UserController.createUser);
        this.router.get("/:id", UserController.getUserDetails);
    }

    public getRouter(): Router {
        return this.router;
    }
}

export default UserRouter;
