interface ISite {
    uri: string;
    mobileScreenshot: string;
    desktopScreenshot: string;
    screenshotExpires: Date;
    skipScreenshot: boolean;
}

export { ISite }