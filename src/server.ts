import App from "./app";

const main = async () => {
    const app = new App();
    await app.start_server();
};

main().catch((err) => {
    console.error(err);
});
