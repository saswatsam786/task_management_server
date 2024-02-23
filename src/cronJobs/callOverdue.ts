import cron from "node-cron";
import twilio from "twilio";
import TaskModel from "../models/Task";
import dotenv from "dotenv";

dotenv.config();

const accountSid = process.env.TWILLO_ACCOUNT_SID as string;
const authToken = process.env.TWILLO_AUTH_TOKEN as string;
// @ts-ignore
const client = new twilio(accountSid, authToken);

// Keep track of the last call time for each user
const lastCallTimes: Record<string, number> = {};

// Define the cron job to run every hour
export default cron.schedule("0 * * * *", async () => {
    try {
        // Find all tasks that are not soft-deleted and overdue
        const overdueTasks = await TaskModel.find({
            deleted_at: null,
            status: { $in: ["TODO", "IN_PROGRESS"] },
            dueDate: { $lt: new Date() },
        }).populate("userId");

        // Sort overdue tasks by priority and dueDate
        overdueTasks.sort((a, b) => {
            if (a.userId.priority !== b.userId.priority) {
                return a.userId.priority - b.userId.priority;
            }
            return a.dueDate.getTime() - b.dueDate.getTime();
        });

        // Call users based on priority
        for (const task of overdueTasks) {
            const { userId, title } = task;
            const phoneNumber = userId.phoneNumber;

            // Check if the user was called in the last 24 hours
            const lastCallTime = lastCallTimes[userId._id] || 0;
            const currentTime = Date.now();

            if (currentTime - lastCallTime > 24 * 60 * 60 * 1000) {
                const message = new twilio.twiml.VoiceResponse();
                message.say(`Hello User, the task "${title}" is due. Please complete it at your earliest convenience.`);
                // Call the user using Twilio
                const call = await client.calls.create({
                    to: `+${phoneNumber}`,
                    from: "+16414183307",
                    twiml: message.toString(),
                });

                console.log(`Calling user with priority ${userId.priority} for task: ${title}`);

                // Wait for a few seconds before calling the next user
                await new Promise((resolve) => setTimeout(resolve, 20000));
                // Check the call status
                const callStatus = await client
                    .calls(call.sid)
                    .fetch()
                    // @ts-ignore
                    .then((call) => call.status);

                if (callStatus !== "completed") {
                    // Update the last call time for the user
                    console.log(
                        `User with priority ${userId.priority} did not respond to the call. Moving on to the next user.`
                    );
                } else {
                    lastCallTimes[userId._id] = currentTime;
                    console.log(`User with priority ${userId.priority} successfully answered the call. Proceeding to the next user.
                    `);
                }
            } else {
                console.log(
                    `User with priority ${userId.priority} was contacted within the last 24 hours. Skipping for now.`
                );
            }
        }

        console.log("Voice calling cron job successfully executed.");
    } catch (error) {
        console.error("Error encountered during the execution of the voice calling cron job:", error);
    }
});
