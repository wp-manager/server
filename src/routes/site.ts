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

router.post("/:uri/crawl", JWTUtils.authorisedUserMiddleware, siteExists, async (req, res) => {
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

    if(site.crawl.status == 'IN_PROGRESS'){
        res.status(409).json({
            message: "Crawl already in progress"
        });
        return;
    }

    if(site.crawl.status == 'QUEUED'){
        res.status(409).json({
            message: "Crawl already queued"
        });
        return;
    }

    // Only allow queueing if the last crawl was more than 1 day
    if(site.crawl.endTime){
        const oneDay = 1000 * 60;
        if(site.crawl.endTime > (Date.now() - oneDay)){
            res.status(429).json({
                message: `You cannot crawl a site that often. Please try again after ${new Date(site.crawl.endTime + oneDay).toLocaleString()}`
            });
            return;
        }
    }

    site.crawl = {
        status: 'QUEUED',
    }
    await site.save();

    res.json({
        message: "Crawl queued"
    });
});

router.all("/:uri/wp-json/*", JWTUtils.authorisedUserMiddleware, siteExists, proxySite);

export default router;

