import express from "express";
import { authSite, handleAuthCallback } from "../controllers/site-auth";
import { handleWPEngineCredentials } from "../controllers/wpengine-auth";
const router = express.Router();

router.get("/callback", handleAuthCallback);
router.get("/:uri", authSite);

router.post('/wpengine', handleWPEngineCredentials);


export default router;

