import express from "express";
import { authSite, handleAuthCallback } from "../controllers/site-auth";
const router = express.Router();

router.get("/callback", handleAuthCallback);
router.get("/:uri", authSite);

export default router;

