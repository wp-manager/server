interface ISite {
    uri: string;
    mobileScreenshot: string;
    mobileScreenshotExpires: Date;
    desktopScreenshot: string;
    desktopScreenshotExpires: Date;
}

export { ISite }