import express from "express";
import { proxySite, siteExists } from "../controllers/site";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.all("/:uri/wp-json/*", JWTUtils.authorisedUserMiddleware, siteExists, proxySite);

export default router;

