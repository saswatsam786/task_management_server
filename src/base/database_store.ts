import mongoose from "mongoose";

class Database {
    private uri_: string;
    /**
     * Constructor for creating a new instance of the class.
     * @param {string} uri - The URI for the instance.
     */
    constructor(uri: string) {
        this.uri_ = uri;
    }

    async connect() {
        try {
            mongoose.set("strictQuery", true);
            await mongoose.connect(this.uri_);
            console.log("Database connected 🎉🚀");
        } catch (err) {
            console.error(err);
        }
    }
}

export default Database;
