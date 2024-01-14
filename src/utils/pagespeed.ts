import puppeteer, { KnownDevices } from "puppeteer";
import Site from "../models/site";

class PagespeedWorker {
    inProgress = [];
    maxConcurrency = parseInt(process.env.MAX_PARALLEL_PAGESPEEDS) || 2;

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
                    pagespeed: null,
                },
                {
                    "pagespeed.expires": {
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
                "pagespeed.expires": 1,
            })
            .limit(1);

        if (sites.length === 0) {
            return;
        }

        return sites[0];
    }

    async processSite(site) {
        console.log(`[${site.uri}] Processing PageSpeed`);

        if (
            !site.pagespeed ||
            !site.pagespeed.expires ||
            site.pagespeed.expires < Date.now()
        ) {
            console.log(`[${site.uri}] Running PageSpeed`);
            try {
                await this.performPagespeed(site, 'MOBILE');
                await this.performPagespeed(site, 'DESKTOP');
                console.log(`[${site.uri}] PageSpeed complete`);
            } catch (e) {
                console.log(
                    `[${site.uri}] Failed to run PageSpeed. Will try again in 30 minutes`
                );
                site.pagespeed.expires = new Date(Date.now() + 30 * 60 * 1000);
                await site.save();
            }
        }
    }

    async performPagespeed(site, strategy: "MOBILE" | "DESKTOP" = "MOBILE") {
        const url = `https://pagespeedonline.googleapis.com/pagespeedonline/v5/runPagespeed?url=https://${site.uri}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO&strategy=${strategy}&key=${process.env.GOOGLE_API_KEY}`;
        const data = await fetch(url).then((res) => res.json()) as any;

        if (!data.lighthouseResult || !data.lighthouseResult.categories) {
            throw new Error("Failed to extract results");
        }

        const categories = Object.keys(data.lighthouseResult.categories);

        let results = {};
        if (categories.includes("performance")) {
            results["performance"] =
                data.lighthouseResult.categories.performance.score;
        }
        if (categories.includes("accessibility")) {
            results["accessibility"] =
                data.lighthouseResult.categories.accessibility.score;
        }
        if (categories.includes("best-practices")) {
            results["bestPractices"] =
                data.lighthouseResult.categories["best-practices"].score;
        }
        if (categories.includes("seo")) {
            results["seo"] = data.lighthouseResult.categories.seo.score;
        }
        if (categories.includes("pwa")) {
            results["pwa"] = data.lighthouseResult.categories.pwa.score;
        }

        if (strategy === "MOBILE") {
            site.pagespeed.mobile = results;
        } else if (strategy === "DESKTOP") {
            site.pagespeed.desktop = results;
        }
        // Expire in 1 hour
        site.pagespeed.expires = new Date(Date.now() + 60 * 60 * 1000);
        await site.save();

        console.log(`[${site.uri}] Results ${JSON.stringify(results)}`);
    }
}

export default PagespeedWorker;
