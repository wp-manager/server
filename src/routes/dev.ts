import express from "express";
import { getAccount, register, login, emailAvailability, logout } from "../controllers/auth";
import JWTUtils from "../utils/jwt";
import Site from "../models/site";
const router = express.Router();

router.get("/delete-screenshots", async (req, res) => {
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

export default router;

