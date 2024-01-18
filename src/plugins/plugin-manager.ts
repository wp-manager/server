import AbstractPlugin from "./abstract-plugin";
import express from "express";
import fs from "fs";

const router = express.Router();

class PluginManager {
    static plugins: AbstractPlugin[] = [];

    static load(){
        const pluginFiles = fs.readdirSync("src/plugins");

        pluginFiles.forEach((pluginFile) => {
        
            if(!fs.lstatSync(`src/plugins/${pluginFile}`).isDirectory()) return;

            const plugin = require(`./${pluginFile}/index.ts`).default;
            const pluginInstance: AbstractPlugin = new plugin();

            // Run any install hooks
            pluginInstance.install();

            // Add plugin routes
            PluginManager.plugins.push(pluginInstance);
            console.log(`Loaded plugin ${pluginInstance.name} v${pluginInstance.version} by ${pluginInstance.author}`);
        });
    }

    static getRoutes(): express.Router {
        this.plugins.forEach((plugin) => {
            router.use(`/plugins/${plugin.name.toLowerCase().replaceAll(" ", "-")}`, plugin.routes(express.Router()));
        });

        return router;
    }
        
}

export default PluginManager;