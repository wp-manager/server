import express from "express";
const router = express.Router();

abstract class AbstractPlugin {
    public name: string;
    public version: string;
    public author: string;

    abstract install(): void;
    abstract routes(router: express.Router): express.Router;

}

export default AbstractPlugin;