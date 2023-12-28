import AbstractPlugin from "../abstract-plugin";
import express from "express";
const router = express.Router();

class ExamplePlugin extends AbstractPlugin {
    name = "Example Plugin";
    version = "0.0.1";
    author = "Darren Griffin";

    constructor(){
        super();
    }

    public getRoutes(){
        router.get("/", (req, res) => {
            res.json({
                name: this.name,
                version: this.version,
                author: this.author,
            });
        });

        return router;
    }

}

export default ExamplePlugin;