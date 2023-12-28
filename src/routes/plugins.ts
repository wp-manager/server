import express from "express";
import fs from "fs";
import PluginManager from "../plugins/plugin-manager";
const router = express.Router();

router.get("/list", (req, res) => {
    res.json(PluginManager.plugins.map((plugin) => {
        return {
            name: plugin.name,
            version: plugin.version,
            author: plugin.author,
        };
    }));
    
});


export default router;

