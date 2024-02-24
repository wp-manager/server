import Site from "../models/site";
import User from "../models/user";
import SiteAuth from "../models/site-auth";
import * as cheerio from "cheerio";
import Stats from "./stats";
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
};

enum CrawlStatus {
    QUEUED = "QUEUED",
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED",
}

enum CrawlStrategy {
    HEAD_ONLY = "HEAD_ONLY",
    FULL = "FULL",
}

class CrawlerWorker {
    crawls: Crawl[] = [];
    maxSiteConcurrency = 4;
    maxCrawlConcurrency = 5;
    urlTimeout = 5000;

    benchmarkMode = true;
    benchmarkSites = [
        "mrdarrengriffin.com",
        "martygriffinfineart.co.uk",
        "www.developherawards.com",
    ];

    statsGroup = "crawler";

    constructor() {}

    async start() {
        setInterval(() => {
            this.processCrawls();
        }, 1 * 5000);
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
            }).limit(this.maxSiteConcurrency - inProgressCrawls.length);
        } else {
            sites = await Site.find({
                $or: [
                    {
                        crawl: null,
                    },
                    {
                        "crawl.expires": null,
                    },
                    {
                        "crawl.expires": {
                            $lt: new Date(Date.now()),
                        },
                    },
                ],
                // Ignore sites that are already in progress
                uri: {
                    $nin: this.crawls.map((site) => site.id),
                },
            }).limit(this.maxSiteConcurrency - inProgressCrawls.length);
        }

        if (!sites) return;

        sites.forEach(async (site) => {
            const crawl: Crawl = {
                id: site.uri,
                status: CrawlStatus.IN_PROGRESS,
                links: [],
                startTime: performance.now(),
            };
            this.crawls.push(crawl);

            crawl.links.push({
                url: site.uri,
                status: CrawlStatus.QUEUED,
                strategy: CrawlStrategy.FULL,
            });

            this.crawl(crawl, async () => {
                crawl.endTime = performance.now();

                let codes = {};
                crawl.links.forEach((link) => {
                    if (!link.result) return;
                    if (!codes[link.result.status]) {
                        codes[link.result.status] = 1;
                    } else {
                        codes[link.result.status]++;
                    }
                });

                crawl.status = CrawlStatus.COMPLETE;

                site.crawl = {
                    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
                    stats: {
                        responseCodeTotals: Object.keys(codes).map((c) => {
                            let count = codes[c];
                            return {
                                code: parseInt(c),
                                count: parseInt(count),
                            };
                        }),
                        totalUrls: crawl.links.length,
                    },
                };
                await site.save();

                setTimeout(() => {
                    this.crawls = this.crawls.filter((c) => c.id !== crawl.id);
                }, 1000 * 10);
            });
        });
    }

    async crawl(crawl: Crawl, onComplete: () => void) {
        this.debug();
        if (
            crawl.links.filter(
                (l) =>
                    l.status === CrawlStatus.COMPLETE ||
                    l.status === CrawlStatus.FAILED
            ).length === crawl.links.length
        ) {
            onComplete();
        }
        // skip if we have 2 or more in progress
        const inProgress = crawl.links.filter(
            (q) => q.status === CrawlStatus.IN_PROGRESS
        );
        if (inProgress.length >= this.maxCrawlConcurrency) {
            return;
        }

        const queued = crawl.links.filter(
            (q) => q.status === CrawlStatus.QUEUED
        );

        // sort by FULL then HEAD_ONLY
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

            this.crawlUrl(link, crawl)
                .then((response) => {
                    if (!response) {
                        link.status = CrawlStatus.FAILED;
                        this.crawl(crawl, onComplete);
                        return;
                    }
                    link.result = response;
                    link.status = CrawlStatus.COMPLETE;

                    if (link.strategy == CrawlStrategy.FULL) {
                        this.discoverLinks(response, link, crawl).then(() => {
                            this.crawl(crawl, onComplete);
                        });
                    } else {
                        this.crawl(crawl, onComplete);
                    }
                })
                .catch((e) => {
                    link.status = CrawlStatus.FAILED;
                    this.crawl(crawl, onComplete);
                });
        });
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

        setTimeout(() => abortController.abort("test"), this.urlTimeout);
        return fetch(urlSanitised, options)
            .then((response) => {
                // if we are redirected, we need to fetch the new url
                if (response.redirected) {
                    const newUrl = response.headers.get("location");
                    // and doesnt already exist in the crawl
                    if (
                        newUrl &&
                        crawl.links.find((l) => l.url === newUrl) === undefined
                    ) {
                        crawl.links.push({
                            url: newUrl,
                            status: CrawlStatus.QUEUED,
                            strategy: CrawlStrategy.FULL,
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
        if (link.strategy === CrawlStrategy.HEAD_ONLY) {
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
                        strategy: CrawlStrategy.HEAD_ONLY,
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
            });
        });

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

            if (crawl.links.find((l) => l.url === prospectLink.url)) {
                return;
            }

            // get the URL without any get or hash
            let rawUrl = prospectLink.url.split("?")[0].split("#")[0];
            if (
                // if the url has an image extension
                rawUrl.match(/\.(jpeg|jpg|gif|png|svg|webp|avif)$/) ||
                // if the url has a css or js extension
                rawUrl.match(/\.(css|js)$/)
            ) {
                prospectLink.strategy = CrawlStrategy.HEAD_ONLY;
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

    debug() {
        Stats.set({
            identifier: "crawler-in-progress",
            label: "Crawls in progress",
            value: this.crawls.map((c) => c.id).join(", "),
            group: this.statsGroup,
        });
        Stats.set({
            identifier: "crawler-spacer",
            label: "",
            value: "",
            group: this.statsGroup,
        });
        this.crawls.forEach((crawl) => {
            let statuses = {};
            let codes = {
                unknown: 0,
            };

            let done = crawl.links.filter(
                (l) =>
                    l.status === CrawlStatus.COMPLETE ||
                    l.status === CrawlStatus.FAILED
            );

            crawl.links.forEach((link) => {
                if (!statuses[link.status]) {
                    statuses[link.status] = 0;
                }
                statuses[link.status]++;
            });

            let duration = 0;
            if (crawl.status == CrawlStatus.COMPLETE) {
                duration = crawl.endTime - crawl.startTime;
            } else {
                duration = performance.now() - crawl.startTime;
            }

            Stats.set({
                identifier: `crawler-${crawl.id}-duration`,
                label: `${crawl.id} duration`,
                value: this.formatTime(duration),
                group: this.statsGroup,
            });

            Stats.set({
                identifier: `crawler-${crawl.id}-status`,
                label: `${crawl.id} status`,
                value: crawl.status,
                group: this.statsGroup,
            });

            Stats.set({
                identifier: `crawler-${crawl.id}-statuses`,
                label: `${crawl.id} statuses`,
                value: Object.keys(statuses)
                    .sort()
                    .map((c) => {
                        return `${c}: ${statuses[c]}`;
                    })
                    .join(", "),
                group: this.statsGroup,
            });

            crawl.links.forEach((link) => {
                if (
                    !(
                        link.status == CrawlStatus.COMPLETE ||
                        link.status == CrawlStatus.FAILED
                    )
                ) {
                    return;
                }
                if (!link.result) {
                    codes["unknown"]++;
                    return;
                }
                if (!codes[link.result.status]) {
                    codes[link.result.status] = 0;
                }
                codes[link.result.status]++;
            });

            Stats.set({
                identifier: `crawler-${crawl.id}-codes`,
                label: `${crawl.id} codes`,
                value: Object.keys(codes)
                    .sort()
                    .map((c) => {
                        return `${c}: ${codes[c]}`;
                    })
                    .join(", "),
                group: this.statsGroup,
            });

            Stats.set({
                identifier: `crawler-${crawl.id}-progress`,
                label: `${crawl.id} progress`,
                value: `${done.length} / ${crawl.links.length} (${(
                    (done.length / crawl.links.length) *
                    100
                ).toFixed(2)}%)`,
                group: this.statsGroup,
            });

            Stats.set({
                identifier: `crawler-${crawl.id}-spacer`,
                label: "",
                value: "",
                group: this.statsGroup,
            });
        });
    }
}

export default CrawlerWorker;
