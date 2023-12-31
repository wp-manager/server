import express from "express";
import { proxyWPE } from "../controllers/site";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.all("/*", JWTUtils.authorisedUserMiddleware, proxyWPE);

export default router;

