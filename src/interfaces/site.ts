interface ISite {
    uri: string;
    mobileScreenshot: string;
    desktopScreenshot: string;
    screenshotExpires: Date;
    skipScreenshot: boolean;
    pagespeed: {
        expires: Date;
        mobile: {
            performance: number;
            accessibility: number;
            bestPractices: number;
            seo: number;
        },
        desktop: {
            performance: number;
            accessibility: number;
            bestPractices: number;
            seo: number;
        }
    },
    crawl: {
        expires: Date;
        stats?: {
            totalUrls: number;
            responseCodeTotals: { code: number, count: number }[];
        },
        results?: [
            {
                url: string;
                redirectDestination: string;
                response: number;
            }
        ]
    }
}

export { ISite }