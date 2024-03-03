import express from "express";
import { getAccount, register, login, emailAvailability, logout } from "../controllers/auth";
import JWTUtils from "../utils/jwt";
import Site from "../models/site";
const router = express.Router();

router.get("/delete-screenshots", JWTUtils.authorisedUserMiddleware, async (req, res) => {
    //@ts-ignore
    if(!req.isAdmin){
        res.status(401).send();
        return;
    }
    const sites = await Site.find({});
    for (const site of sites) {
        site.mobileScreenshot = "";
        site.desktopScreenshot = "";
        site.screenshotExpires = new Date(Date.now() - 3600000);
        await site.save();
    }
    res.json({
        success: true,
    });
});

router.get("/delete-pagespeeds", JWTUtils.authorisedUserMiddleware, async (req, res) => {
    //@ts-ignore
    if(!req.isAdmin){
        res.status(401).send();
        return;
    }
    const sites = await Site.find({});
    for (const site of sites) {
        site.pagespeed = null;
        site.pagespeed.expires = new Date(Date.now() - 3600000);
        await site.save();
    }
    res.json({
        success: true,
    });
});

router.get("/delete-crawls", JWTUtils.authorisedUserMiddleware, async (req, res) => {
    //@ts-ignore
    if(!req.isAdmin){
        res.status(401).send();
        return;
    }
    const sites = await Site.find({});
    for (const site of sites) {
        site.crawl = null;
        await site.save();
    }
    res.json({
        success: true,
    });
});

export default router;

