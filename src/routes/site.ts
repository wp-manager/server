import express from "express";
import { proxySite, screenshotDesktop, screenshotMobile, siteExists } from "../controllers/site";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.get("/:uri/screenshot", JWTUtils.authorisedUserMiddleware, siteExists, screenshotDesktop);
router.get("/:uri/screenshot/mobile", JWTUtils.authorisedUserMiddleware, siteExists, screenshotMobile);
router.all("/:uri/wp-json/*", JWTUtils.authorisedUserMiddleware, siteExists, proxySite);

export default router;

