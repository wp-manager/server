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
    }
}

export { ISite }