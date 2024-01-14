import { Schema, model } from "mongoose"
import { ISite } from "../interfaces/site";

const siteSchema = new Schema<ISite>({
    uri: String,
    mobileScreenshot: String,
    mobileScreenshotExpires: Date,
    desktopScreenshot: String,
    desktopScreenshotExpires: Date,
});

const Site = model<ISite>("Site", siteSchema);

export default Site;