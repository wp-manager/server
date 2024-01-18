import AbstractPlugin from "../abstract-plugin";
import express from "express";
import { proxy } from "./controllers/proxy";

class ExamplePlugin extends AbstractPlugin {
    name = "WP Engine API Proxy";
    version = "0.0.1";
    author = "Darren Griffin";

    install(): void {
        
    }

    routes(router: express.Router): express.Router {
        router.use(require("./routes").default);

        return router;
    }
}

export default ExamplePlugin;