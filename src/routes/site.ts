import express from "express";
import { pagespeed, proxySite, screenshotDesktop, screenshotMobile, siteExists } from "../controllers/site";
import JWTUtils from "../utils/jwt";
const router = express.Router();

router.get("/:uri/screenshot", JWTUtils.authorisedUserMiddleware, siteExists, screenshotDesktop);
router.get("/:uri/screenshot/mobile", JWTUtils.authorisedUserMiddleware, siteExists, screenshotMobile);

router.all("/:uri/pagespeed", JWTUtils.authorisedUserMiddleware, siteExists, pagespeed);

router.get("/:uri/crawl", JWTUtils.authorisedUserMiddleware, siteExists, async (req, res) => {
    //@ts-ignore
    if(!req.site){
        res.status(400).send();
        return;
    }
    //@ts-ignore
    const site = req.site;

    if(!site){
        res.status(400).send();
        return;
    }

    if(site.crawl){
        res.json(site.crawl);
    };
});

router.all("/:uri/wp-json/*", JWTUtils.authorisedUserMiddleware, siteExists, proxySite);

export default router;

