import express from "express";
const router = express.Router();

class AbstractPlugin {
    public name: string;
    public version: string;
    public author: string;

    getRoutes(): any {
        return router;
    }

}

export default AbstractPlugin;