import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import Database from "./base/database_store";
import * as dotenv from "dotenv";
import UserRouter from "./routes/UserRoute";
import TasksRouter from "./routes/TaskRoute";
import SubTaskRouter from "./routes/SubTaskRoute";
import callOverdue from "./cronJobs/callOverdue";
import priorityAssign from "./cronJobs/priorityAssign";

dotenv.config();

class App {
    private db_ = new Database(process.env.MONGO_URL as string);
    private app_ = express();
    private userRoutes_ = new UserRouter();
    private taskRoutes_ = new TasksRouter();
    private subTaskRoutes_ = new SubTaskRouter();
    private PORT_ = process.env.PORT || 4000;

    constructor() {
        this.db_.connect();
        this.app_.use(express.urlencoded({ extended: true }));
        this.app_.use(express.json());
        this.app_.use(
            cors({
                origin: "*",
            })
        );
        this.app_.use(morgan("tiny"));
        this.app_.use("/user", this.userRoutes_.getRouter());
        this.app_.use("/task", this.taskRoutes_.getRouter());
        this.app_.use("/subtask", this.subTaskRoutes_.getRouter());
        priorityAssign.start();
        callOverdue.start();
        this.handleErrors();
    }
    public get_app() {
        return this.app_;
    }

    private handleErrors(): void {
        this.app_.use((err: any, req: Request, res: Response, next: NextFunction) => {
            const status = err.status || 500;
            const message = err.message || "Something went wrong";
            return res.status(status).json({
                success: false,
                status,
                message,
            });
        });
    }

    public start_server = async () => {
        this.app_.listen(this.PORT_, () => {
            console.log(`Server is listening on port ${this.PORT_}`);
        });
    };
}

export default App;
