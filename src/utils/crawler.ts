import Site from "../models/site";
import * as cheerio from "cheerio";

type Crawl = {
    id: string;
    links?: CrawlLink[];
    status: CrawlStatus;
    startTime?: number;
    endTime?: number;
};

type CrawlLink = {
    url: string;
    result?: Response;
    strategy?: CrawlStrategy;
    status: CrawlStatus;
    inlinks?: string[];
    outlinks?: string[];
};

export enum CrawlStatus {
    QUEUED = "QUEUED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED",
}

enum CrawlStrategy {
    HEAD = "HEAD",
    FULL = "FULL",
}

class CrawlerWorker {
    crawls: Crawl[] = [];
    maxSiteConcurrency = parseInt(process.env.MAX_SITE_CONCURRENCY);
    maxCrawlConcurrency = parseInt(process.env.MAX_CRAWL_CONCURRENCY);
    urlTimeout = 1000 * 10; // 10 seconds

    benchmarkMode = false;
    benchmarkSites = ["mrdarrengriffin.com"];

    async start() {
        await this.clearInProgressCrawls();
        setInterval(() => {
            this.processCrawls();
        }, 1 * 5000);
    }

    async clearInProgressCrawls() {
        let sites = await Site.find({
            "crawl.status": CrawlStatus.IN_PROGRESS,
        });
        sites.forEach(async (site) => {
            site.crawl.status = CrawlStatus.FAILED;
            // remove all results that are 2xx
            site.crawl.results = site.crawl.results.filter(
                (r) => !r.response.toString().startsWith("2")
            );
            await site.save();
        });
    }

    async processCrawls() {
        const inProgressCrawls = this.crawls.filter(
            (crawl) =>
                crawl.status === CrawlStatus.IN_PROGRESS ||
                crawl.status === CrawlStatus.QUEUED
        );

        if (inProgressCrawls.length >= this.maxSiteConcurrency) {
            return;
        }

        let sites;

        if (this.benchmarkMode) {
            sites = await Site.find({
                uri: {
                    $in: this.benchmarkSites,
                    $nin: this.crawls.map((site) => site.id),
                },
                "crawl.status": CrawlStatus.QUEUED,
            }).limit(this.maxSiteConcurrency - inProgressCrawls.length);
        } else {
            sites = await Site.find({
                // Ignore sites that are already in progress
                uri: {
                    $nin: this.crawls.map((crawl) => crawl.id),
                },
                "crawl.status": CrawlStatus.QUEUED,
            }).limit(this.maxSiteConcurrency - inProgressCrawls.length);
        }

        if (!sites) return;

        sites.forEach(async (site) => {
            const crawl: Crawl = {
                id: site.uri,
                status: CrawlStatus.IN_PROGRESS,
                links: [],
                startTime: Date.now(),
            };
            this.crawls.push(crawl);

            crawl.links.push({
                url: site.uri,
                status: CrawlStatus.QUEUED,
                strategy: CrawlStrategy.FULL,
                outlinks: [],
                inlinks: [],
            });

            site.crawl = {
                status: CrawlStatus.IN_PROGRESS,
            };

            this.periodicSave(site, crawl);

            console.log(`Crawling ${site.uri}`);
            this.crawl(crawl, async () => {
                crawl.endTime = Date.now();
                crawl.status = CrawlStatus.COMPLETE;
                console.log(`Crawl of ${site.uri} complete`);
            });
        });
    }

    async crawl(crawl: Crawl, completeFn: () => void) {
        const done = crawl.links.filter(
            (l) =>
                l.status === CrawlStatus.COMPLETE ||
                l.status === CrawlStatus.FAILED
        );

        const inProgress = crawl.links.filter(
            (l) => l.status === CrawlStatus.IN_PROGRESS
        );

        const queued = crawl.links.filter(
            (q) => q.status === CrawlStatus.QUEUED
        );

        if (done.length === crawl.links.length) {
            completeFn();
        }

        // skip if we have too many in progress than what the max concurrency allows
        if (inProgress.length >= this.maxCrawlConcurrency) {
            return;
        }

        // sort by FULL then HEAD
        let toCrawl = queued
            .sort((a, b) => {
                if (a.strategy === CrawlStrategy.FULL) {
                    return -1;
                }
                if (b.strategy === CrawlStrategy.FULL) {
                    return 1;
                }
                return 0;
            })
            .slice(0, this.maxCrawlConcurrency - inProgress.length);

        toCrawl.forEach((link) => {
            link.status = CrawlStatus.IN_PROGRESS;

            try {
                this.crawlUrl(link, crawl)
                    .then((response) => {
                        if (!response) {
                            link.status = CrawlStatus.FAILED;
                            this.crawl(crawl, completeFn);
                            return;
                        }

                        link.result = response;
                        link.status = CrawlStatus.COMPLETE;

                        if (link.strategy == CrawlStrategy.FULL) {
                            this.discoverLinks(response, link, crawl).then(
                                () => {
                                    this.crawl(crawl, completeFn);
                                }
                            );
                        } else {
                            this.crawl(crawl, completeFn);
                        }
                    })
                    .catch((e) => {
                        link.status = CrawlStatus.FAILED;
                        this.crawl(crawl, completeFn);
                    });
            } catch (e) {
                link.status = CrawlStatus.FAILED;
                this.crawl(crawl, completeFn);
            }
        });
    }

    async periodicSave(site, crawl: Crawl) {
        let codes = {};
        crawl.links.reduce((acc, link) => {
            if (!link.result) return acc;
            if (!acc[link.result.status]) {
                acc[link.result.status] = 1;
            } else {
                acc[link.result.status]++;
            }
            return acc;
        }, codes);

        let results = crawl.links
            .map((l) => {
                if (!l.result) return;
                // if result was 200 OK, we don't need to store the response text
                //if (l.result.ok) return;
                return {
                    url: l.url,
                    response: l.result.status,
                    responseText: l.result.statusText,
                    redirect: l.result.headers.get("location")
                    ? l.result.headers.get("location")
                    : null,
                    inlinks: l.inlinks,
                    outlinks: l.outlinks,
                };
            })
            .filter((r) => r);

        // dont store the response text if it's a 200
        // results = results.filter((r) => {
        //     return !r.response.toString().startsWith("2");
        // });

        site.crawl = {
            status: crawl.status,
            startTime: crawl.startTime,
            stats: {
                responseCodeTotals: Object.keys(codes).map((c) => {
                    let count = codes[c];
                    return {
                        code: parseInt(c),
                        count: parseInt(count),
                    };
                }),
                total: crawl.links.length,
                done: crawl.links.filter(
                    (l) =>
                        l.status === CrawlStatus.COMPLETE ||
                        l.status === CrawlStatus.FAILED
                ).length,
            },
            results,
        };

        if (crawl.status === CrawlStatus.COMPLETE) {
            site.crawl.endTime = crawl.endTime;
        }

        await site.save();

        if (crawl.status === CrawlStatus.COMPLETE) {
            this.crawls = this.crawls.filter((c) => c.id !== crawl.id);
            return;
        }

        // If the crawl is still in progress, we should save again in a few seconds
        setTimeout(() => {
            this.periodicSave(site, crawl);
        }, 1000);
    }

    async crawlUrl(link: CrawlLink, crawl: Crawl) {
        let urlSanitised = "https://" + link.url.replace(/https?:\/\//, "");

        const abortController = new AbortController();

        let options: RequestInit = {
            method: "HEAD",
            redirect: "manual",
            headers: {
                "User-Agent": "Googlebot",
            },
            signal: abortController.signal,
        };

        if (link.strategy === CrawlStrategy.FULL) {
            options.method = "GET";
        }

        console.log(`[${link.strategy}] ${urlSanitised}`);

        // if url is not on the same origin, we should not crawl it
        if (
            !urlSanitised.startsWith(
                "https://" + crawl.links[0].url.replace(/https?:\/\//, "")
            )
        ) {
            return;
        }

        setTimeout(() => {
            if (link.status === CrawlStatus.IN_PROGRESS) {
                abortController.abort();
                link.status = CrawlStatus.FAILED;
            }
        }, this.urlTimeout);

        return fetch(urlSanitised, options)
            .then((response) => {
                // if we are redirected, we need to fetch the new url
                if (response.headers.get("location")) {
                    const newUrl = response.headers.get("location"); // and doesnt already exist in the crawl



                    if (
                        newUrl &&
                        crawl.links.find((l) => l.url === newUrl) === undefined
                    ) {
                        crawl.links.push({
                            url: newUrl,
                            status: CrawlStatus.QUEUED,
                            strategy: CrawlStrategy.FULL,
                            inlinks: [urlSanitised],
                        });
                    }
                }

                return response;
            })
            .catch((e) => {
                console.log(e);
            });
    }

    async discoverLinks(response: Response, link: CrawlLink, crawl: Crawl) {
        // If the strategy is to only do a HEAD request, there will be no body to parse, so let's skip
        if (link.strategy === CrawlStrategy.HEAD) {
            return;
        }

        // If the response is not 200, we should not parse the body
        if (response.status !== 200) {
            return;
        }

        // Parse the body
        const html = await response.text();
        const $ = await cheerio.load(html);

        // Count how many links we added. Used for stats
        let added = 0;

        // Create a base url to compare against. We use the first link in the crawl as it was the origin of the crawl
        let origin = "https://" + crawl.links[0].url.replace(/https?:\/\//, "");

        // Create an array to store the links we find
        let prospectLinks: CrawlLink[] = [];

        // Link detection
        const anchors = $("a");
        anchors.each((i, a) => {
            const url = $(a).attr("href");
            if (!url) return;

            prospectLinks.push({
                url,
                status: CrawlStatus.QUEUED,
                strategy: CrawlStrategy.FULL,
                inlinks: [link.url],
                outlinks: [],
            });
        });

        // Image detection
        const images = $("img, picture, source");
        images.each((i, image) => {
            image.attributes.forEach((attr) => {
                // ignore srcset
                //if (attr.name === "srcset") return;
                // There might be multiple urls in an attribute (srcset for example). Let's extract them all
                let urls = attr.value.match(/https?:\/\/\S*/g);
                if (!urls) return;

                urls.forEach((url) => {
                    prospectLinks.push({
                        url,
                        status: CrawlStatus.QUEUED,
                        strategy: CrawlStrategy.HEAD,
                        inlinks: [link.url],
                        outlinks: [],
                    });
                });
            });
        });

        // Stylesheet and script detection
        const stylesScripts = $("link, script[src]");
        stylesScripts.each((i, a) => {
            // Don't do rel="shortlink" or rel="canonical"
            if (
                $(a).attr("rel") === "shortlink" ||
                $(a).attr("rel") === "canonical"
            ) {
                return;
            }

            const url = $(a).attr("href") || $(a).attr("src");
            if (!url) return;

            prospectLinks.push({
                url,
                status: CrawlStatus.QUEUED,
                strategy: CrawlStrategy.FULL,
                inlinks: [link.url],
                outlinks: [],
            });
        });

        if(!prospectLinks.length){
            return;
        }

        // Go through all the prospect links and ensure there are
        // no duplicates, they are from the same origin
        // and they're not wp-json or add-to-cart links or xmlrpc.php
        prospectLinks.forEach((prospectLink) => {
            if (!prospectLink.url.startsWith(origin)) {
                return;
            }

            if (
                prospectLink.url.includes("/wp-json/") ||
                prospectLink.url.includes("?add-to-cart=") ||
                prospectLink.url.includes("xmlrpc.php")
            ) {
                return;
            }

            // remove any hash
            prospectLink.url = prospectLink.url.split("#")[0];

            // Add the found valid link as an outlink to the parent link
            if(!link.outlinks.find((l) => l === prospectLink.url)){
                link.outlinks.push(prospectLink.url);
            }

            let existingLink = crawl.links.find((l) => l.url === prospectLink.url);
            
            if (existingLink) {
                if(!existingLink.inlinks.find((l) => l === link.url)){
                    existingLink.inlinks.push(link.url);
                }
                return;
            }

            // get the URL without any get or hash
            let rawUrl = prospectLink.url.split("?")[0];
            if (
                // if the url has an image extension
                rawUrl.match(/\.(jpeg|jpg|gif|png|svg|webp|avif)$/) ||
                // if the url has a css or js extension
                rawUrl.match(/\.(css|js)$/)
            ) {
                prospectLink.strategy = CrawlStrategy.HEAD;
            }

            crawl.links.push(prospectLink);
            added++;
        });
    }

    formatTime(milliseconds: number): string {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const remainingSeconds = totalSeconds % 60;

        const formattedHours = String(hours).padStart(2, "0");
        const formattedMinutes = String(minutes).padStart(2, "0");
        const formattedSeconds = String(remainingSeconds).padStart(2, "0");

        if (hours > 0) {
            return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
        } else {
            return `${formattedMinutes}:${formattedSeconds}`;
        }
    }
}

export default CrawlerWorker;
