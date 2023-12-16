import express from "express";
import https from "https";
import mongoose from "mongoose";
import fs from "fs";
import authRoutes from "./routes/auth";
import passkeyRoutes from "./routes/passkey";
import siteRoutes from "./routes/site";
import sitesRoutes from "./routes/sites";
import siteAuthRoutes from "./routes/site-auth";
import cors from "cors";

mongoose.connect("mongodb://localhost:27017/test");

const app = express();

// set hostname
const options = {
    webserver: {
        cors: [
            "https://localhost:5173",
            "https://home.mrdarrengriffin.com:2053",
        ],
        https: {
            hostname: "localhost",
            ssl: {
                key: fs.readFileSync("key.pem"),
                cert: fs.readFileSync("cert.pem"),
            },
        },
    },
};

app.use(
    cors({
        origin: options.webserver.cors,
        credentials: true,
    })
);

app.use(express.json());

app.use('/auth', authRoutes);
app.use("/passkey", passkeyRoutes);
app.use("/site-auth", siteAuthRoutes);
app.use("/site", siteRoutes);
app.use("/sites", sitesRoutes);

const server = https.createServer(options.webserver.https.ssl, app);
server.listen(8443, () => {
    console.log("Server listening on port 8443");
});
