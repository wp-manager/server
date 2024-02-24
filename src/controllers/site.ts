import Site from "../models/site";
import WordpressAPI from "../utils/wordpress";
import SiteAuth from "../models/site-auth";
import puppeteer, { KnownDevices } from "puppeteer";

const siteExists = async (req, res, next) => {
    let uri = req.params.uri;
    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace("https://", "").replace("http://", "");

    let site = await Site.findOne({
        uri,
    });

    let siteAuth = await SiteAuth.findOne({
        user: req.user,
        site: site,
    }).projection({ _id: 0});

    if (!siteAuth) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }

    req.site = site;

    next();
};

const proxySite = async (req, res) => {
    let uri = req.params.uri;
    // replace http://, https://, and www. with nothing. Also remove everything after the tld
    uri = uri.replace(["https://", "http://"], "");

    const site = await Site.findOne({
        uri,
    });

    if (!site) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }

    let siteAuth = await SiteAuth.findOne({
        user: req.user,
        site,
    }).populate("site");

    if (!siteAuth) {
        res.status(404).json({
            error: "Site not found",
        });
        return;
    }

    let proxyPath = req.params[0];

    let wpApi = new WordpressAPI(site.uri, siteAuth.auth);

    // include ?a params
    await wpApi
        .request(req.method, proxyPath, req.query, req.body)
        .then(async (response) => {
            if (!response.ok) {
                const body = await response.text();
                return res.status(response.status).send(body);
            }

            const body = await response.json();
            return res.status(response.status).json(body);
        })
        .catch((error) => {
            res.status(500).json({
                error: "Failed to proxy request",
            });
            return;
        });
    return;
};

const screenshotDesktop = async (req, res) => {
    if (!req.site || !req.site.uri) {
        res.status(400).json({
            error: "Unable to load site",
        });
        return;
    }

    req.setTimeout(5000);

    if (req.site.desktopScreenshot) {
        // Use existing screenshot
        res.set("Content-Type", "image/webp");
        let screenshot = Buffer.from(req.site.desktopScreenshot, "base64");
        res.send(screenshot);
        return;
    } else {
        res.status(400).json({
            error: "No screenshot available",
        });
    }
};

const screenshotMobile = async (req, res) => {
    if (!req.site || !req.site.uri) {
        res.status(400).json({
            error: "Unable to load site",
        });
        return;
    }

    req.setTimeout(5000);

    if (req.site.mobileScreenshot) {
        // Use existing screenshot
        res.set("Content-Type", "image/webp");
        let screenshot = Buffer.from(req.site.mobileScreenshot, "base64");
        res.send(screenshot);
        return;
    } else {
        res.status(400).json({
            error: "No screenshot available",
        });
    }

    return;
};

const pagespeed = async (req, res) => {
    if (!req.site || !req.site.uri) {
        res.status(400).json({
            error: "Unable to load site",
        });
        return;
    }

    if (req.site.pagespeed) {
        res.json({
            desktop: {
                performance: req.site.pagespeed.desktop.performance,
                accessibility: req.site.pagespeed.desktop.accessibility,
                bestPractices: req.site.pagespeed.desktop.bestPractices,
                seo: req.site.pagespeed.desktop.seo,
            },
            mobile: {
                performance: req.site.pagespeed.mobile.performance,
                accessibility: req.site.pagespeed.mobile.accessibility,
                bestPractices: req.site.pagespeed.mobile.bestPractices,
                seo: req.site.pagespeed.mobile.seo,
            },
            expires: req.site.pagespeed.expires,
        });

        return;
    } else {
        res.status(400).json({
            error: "No PageSpeed available",
        });
    }

    return;
};

export {
    proxySite,
    siteExists,
    screenshotDesktop,
    screenshotMobile,
    pagespeed,
};
