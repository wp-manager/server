import { Schema, model } from "mongoose"
import { ISite } from "../interfaces/site";

const siteSchema = new Schema<ISite>({
    uri: String,
    mobileScreenshot: String,
    desktopScreenshot: String,
    screenshotExpires: Date,
    skipScreenshot: Boolean,
});

const Site = model<ISite>("Site", siteSchema);

export default Site;