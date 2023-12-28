import express from "express";
import https from "https";
import mongoose from "mongoose";
import fs from "fs";
import authRoutes from "./routes/auth";
import passkeyRoutes from "./routes/passkey";
import siteRoutes from "./routes/site";
import sitesRoutes from "./routes/sites";
import pluginRoutes from "./routes/plugins";
import siteAuthRoutes from "./routes/site-auth";
import cors from "cors";
import User from "./models/user";
import Site from "./models/site";
import wpengineRoutes from "./routes/wpengine";
import PluginManager from "./plugins/plugin-manager";
mongoose.connect("mongodb://localhost:27017/test");
const app = express();
app.use(express.urlencoded());
app.use(express.json());

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

PluginManager.load();
PluginManager.plugins.forEach((plugin) => {
    app.use(`/plugins/${plugin.name.replace(" ", "-").toLowerCase()}`, plugin.getRoutes());
});



app.use("/auth", authRoutes);
app.use("/passkey", passkeyRoutes);
app.use("/site-auth", siteAuthRoutes);
app.use("/site", siteRoutes);
app.use("/sites", sitesRoutes);
app.use("/wpengine", wpengineRoutes);
app.use("/plugins", pluginRoutes);

const server = https.createServer(options.webserver.https.ssl, app);
server.listen(8443, () => {
    console.log("Server listening on port 8443");
});

if (true) {
    let sites = Site.find().then(async (sites) => {
        let user = await User.findOne({
            username: "MrDarrenGriffin",
        });

        if (!user) {
            user = new User({
                username: "MrDarrenGriffin",
            });
        }

        user.save();

        sites.forEach((site) => {
            site.user = user;
            site.save();
        });

        let a = Site.findOne({
            uri: "mrdarrengriffin.com",
        }).then((site) => {
            site.wpeInstallId = "";
            site.save();
        });
    });
}
