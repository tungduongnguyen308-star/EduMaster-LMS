import "dotenv/config";
import app from "./app";
import prisma from "./config/prisma";

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        await prisma.$connect();

        console.log("MySQL connected successfully!");

        app.listen(PORT, () => {
            console.log(
                `Server running at http://localhost:${PORT}`
            );
        });
    } catch (error) {
        console.error("Server startup failed:", error);
        process.exit(1);
    }
}

startServer();