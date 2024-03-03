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
        startTime: number;
        endTime: number;
        status: string;
        stats?: {
            total: number;
            done: number;
            responseCodeTotals: { code: number, count: number }[];
        },
        results?: {
                url: string;
                response: number;
                responseText: string;
                redirect?: string;
        }[];
    }
}

export { ISite }