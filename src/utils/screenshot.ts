import puppeteer, { KnownDevices } from "puppeteer";
import Site from "../models/site";

class ScreenshotWorker {
    inProgress = [];
    currentSite = null;
    maxConcurrency = parseInt(process.env.MAX_PARALLEL_SCREENSHOTS) || 2;

    async start() {
        this.doJob();
        setInterval(() => {
            this.doJob();
        }, 1 * 1000);
    }

    async doJob() {
        if (this.inProgress.length > this.maxConcurrency) {
            return;
        }

        const site = await this.getSite();

        if (!site) {
            return;
        }

        this.inProgress.push(site.uri);

        await this.processSite(site);
        this.inProgress = this.inProgress.filter((uri) => uri !== site.uri);
    }

    async getSite() {
        const sites = await Site.find({
            $or: [
                {
                    mobileScreenshot: null,
                },
                {
                    desktopScreenshot: null,
                },
                {
                    screenshotExpires: null,
                },
                {
                    screenshotExpires: {
                        $lt: new Date(Date.now()),
                    },
                },
            ],
            // Ignore sites that are already in progress
            uri: {
                $nin: this.inProgress,
            },
        })
            .sort({
                screenshotExpires: 1,
            })
            .limit(1);

        if (sites.length === 0) {
            return;
        }

        return sites[0];
    }

    async processSite(site) {
        console.log(`[${site.uri}] Processing screenshots`);

        if (
            !site.mobileScreenshot ||
            !site.desktopScreenshot ||
            !site.screenshotExpires ||
            site.screenshotExpires < Date.now()
        ) {
            console.log(`[${site.uri}] Capturing screenshots`);
            await this.captureScreenshots(site);
            console.log(`[${site.uri}] Captured screenshots`);

           
        }

        site = null;
    }

    async captureScreenshots(site) {
        // Prepare browser
        const browser = await puppeteer.launch({ headless: 'new' });

        try {
            const page = await browser.newPage();

            // Load site
            await page.goto(`https://${site.uri}`);

            // Set viewport
            await page.setViewport({
                width: 1200,
                height: 720,
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

            // Wait for a second
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Remove unwanted elements
            // CookieHub banner
            await page.addStyleTag({
                content: ".ch2 { display: none !important; }",
            });

            // Let the dust settle
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Take screenshot
            const desktopScreenshot = await page.screenshot({
                type: "webp",
                quality: 50,
                encoding: "base64",
                optimizeForSpeed: true,
            });

            site.desktopScreenshot = desktopScreenshot;
            await site.save();

            // Mobile
            const device = KnownDevices["iPhone 13 Pro"];
            await page.emulate(device);

            // Set viewport
            await page.setViewport(device.viewport);

            // Scroll to top just in case
            await page.mouse.wheel({ deltaY: -1000 });

            // Wait for a second
            await new Promise((resolve) => setTimeout(resolve, 0));

            // Take screenshot
            const mobileScreenshot = await page.screenshot({
                type: "webp",
                quality: 80,
                encoding: "base64",
                optimizeForSpeed: true,
            });

            // Close browser
            await browser.close();

            site.mobileScreenshot = mobileScreenshot;

            // Expire in 24 hours
            site.screenshotExpires = new Date(Date.now() + (1000 * 60 * 60 * 24));
            await site.save();
        } catch (e) {
            await browser.close();
            console.log(
                `[${site.uri}] Failed to capture screenshots. Will retry in 30 minutes`
            );
            // Expire in 30 minutes
            site.screenshotExpires = new Date(Date.now() + (60 * 30 * 1000));
            await site.save();
        }
    }
}

export default ScreenshotWorker;
