import express from "express";
import { authSite, handleAuthCallback } from "../controllers/site-auth";
import { handleWPEngineCredentials } from "../controllers/wpengine-auth";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.get("/callback", handleAuthCallback);
router.get("/:uri", JWTUtils.authorisedUserMiddleware, authSite);

router.post('/wpengine', JWTUtils.authorisedUserMiddleware, handleWPEngineCredentials);


export default router;

