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
    });

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

    if(req.site.desktopScreenshot && req.site.desktopScreenshotExpires && req.site.desktopScreenshotExpires > Date.now() && !req.query.refresh){
        // Use existing screenshot
        res.set("Content-Type", "image/webp");
        let screenshot = Buffer.from(req.site.desktopScreenshot, "base64");
        res.send(screenshot);
        return;
    }
    
    // Take new screenshot

    // Prepare browser
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();

    // Load site
    await page.goto(`https://${req.site.uri}`);

    // Set viewport
    await page.setViewport({
        width: 1920,
        height: 1080,
    });

    // Some sites don't load assets until an interaction is made by the user
    // We simulate a scroll to ensure everything is loaded
    await page.mouse.wheel({ deltaY: 100 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await page.mouse.wheel({ deltaY: -200 });

    // Remove scrollbars
    await page.addStyleTag({
        content: "body { overflow: hidden !important; }",
    });

    // Remove unwanted elements
    // CookieHub banner
    await page.addStyleTag({ content: ".ch2 { display: none !important; }" });

    // Let the dust settle
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Take screenshot
    const screenshot = await page.screenshot({
        type: "webp",
        quality: 80,
        encoding: "base64",
    });

    // Close browser
    await browser.close();

    // Store screenshot and set the expiry date to 24 hours from now
    req.site.desktopScreenshot = screenshot;
    req.site.desktopScreenshotExpires = Date.now() + (1000 * 60 * 60 * 24);
    await req.site.save();

    // Serve screenshot
    const screenshotImage = Buffer.from(screenshot, "base64");
    res.set("Content-Type", "image/webp");
    res.send(screenshotImage);
}

const screenshotMobile = async (req, res) => {
    if (!req.site || !req.site.uri) {
        res.status(400).json({
            error: "Unable to load site",
        });
        return;
    }

    if(req.site.mobileScreenshot && req.site.mobileScreenshotExpires && req.site.mobileScreenshotExpires > Date.now() && !req.query.refresh){
        // Use existing screenshot
        res.set("Content-Type", "image/webp");
        let screenshot = Buffer.from(req.site.mobileScreenshot, "base64");
        res.send(screenshot);
        return;
    }
    
    // Take new screenshot

    // Prepare browser
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    const device = KnownDevices["iPhone 13 Pro"];
    await page.emulate(device);
    // Load site
    await page.goto(`https://${req.site.uri}`);

    // Set viewport
    await page.setViewport(device.viewport);

    // Some sites don't load assets until an interaction is made by the user
    // We simulate a scroll to ensure everything is loaded
    await page.mouse.wheel({ deltaY: 100 });
    await new Promise((resolve) => setTimeout(resolve, 50));
    await page.mouse.wheel({ deltaY: -200 });

    // Remove scrollbars
    await page.addStyleTag({
        content: "body { overflow: hidden !important; }",
    });

    // Remove unwanted elements
    // CookieHub banner
    await page.addStyleTag({ content: ".ch2 { display: none !important; }" });

    // Let the dust settle
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Take screenshot
    const screenshot = await page.screenshot({
        type: "webp",
        quality: 80,
        encoding: "base64",
    });

    // Close browser
    await browser.close();

    // Store screenshot and set the expiry date to 24 hours from now
    req.site.mobileScreenshot = screenshot;
    req.site.mobileScreenshotExpires = Date.now() + (1000 * 60 * 60 * 24);
    await req.site.save();

    // Serve screenshot
    const screenshotImage = Buffer.from(screenshot, "base64");
    res.set("Content-Type", "image/webp");
    res.send(screenshotImage);
}

export { proxySite, siteExists, screenshotDesktop, screenshotMobile };
