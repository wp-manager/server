import AbstractPlugin from "./abstract-plugin";
import fs from "fs";

class PluginManager {
    static plugins: AbstractPlugin[] = [];


    static load(){
        const pluginFiles = fs.readdirSync("src/plugins");
        pluginFiles.forEach((pluginFile) => {
            if(!fs.lstatSync(`src/plugins/${pluginFile}`).isDirectory()) return;

            const plugin = require(`./${pluginFile}/index.ts`).default;
            const pluginInstance = new plugin();

            PluginManager.plugins.push(pluginInstance);
            console.log(`Loaded plugin ${pluginInstance.name} v${pluginInstance.version} by ${pluginInstance.author}`);
        });
    }

}

export default PluginManager;