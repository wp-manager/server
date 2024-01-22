import express from "express";
const router = express.Router();

import {proxy} from './controllers/proxy';
import { deleteToken, hasToken, updateToken } from "./controllers/auth";
import JWTUtils from "../../utils/jwt";

// Auth management routes
router.get("/auth", JWTUtils.authorisedUserMiddleware, hasToken);
router.post("/auth", JWTUtils.authorisedUserMiddleware, updateToken);
router.delete("/auth", JWTUtils.authorisedUserMiddleware, deleteToken);

// Proxy routes
router.all('/api/*', JWTUtils.authorisedUserMiddleware, proxy);

export default router;