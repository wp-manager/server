import express from "express";
const router = express.Router();

import {proxy} from './controllers/proxy';
import { deleteToken, hasToken, updateToken } from "./controllers/auth";
import JWTUtils from "../../utils/jwt";
import { assignSite, assignedSite } from "./controllers/site";

// Auth management routes
router.get("/auth", JWTUtils.authorisedUserMiddleware, hasToken);
router.post("/auth", JWTUtils.authorisedUserMiddleware, updateToken);
router.delete("/auth", JWTUtils.authorisedUserMiddleware, deleteToken);

// Proxy routes
router.all('/api/*', JWTUtils.authorisedUserMiddleware, proxy);

// Site assign
router.post('/assign-site', JWTUtils.authorisedUserMiddleware, assignSite);
router.get('/assigned-site/:uri', JWTUtils.authorisedUserMiddleware, assignedSite);

export default router;