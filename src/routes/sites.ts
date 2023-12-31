import express from "express";
import { getUserSites } from "../controllers/sites";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.all("/", JWTUtils.authorisedUserMiddleware, getUserSites);

export default router;