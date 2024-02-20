import { Schema, model } from "mongoose";
import { ISite } from "../interfaces/site";

const siteSchema = new Schema<ISite>({
    uri: String,
    mobileScreenshot: String,
    desktopScreenshot: String,
    screenshotExpires: Date,
    skipScreenshot: Boolean,
    pagespeed: {
        expires: Date,
        mobile: {
            performance: Number,
            accessibility: Number,
            bestPractices: Number,
            seo: Number,
        },
        desktop: {
            performance: Number,
            accessibility: Number,
            bestPractices: Number,
            seo: Number,
        },
    },
    crawl: {
        expires: Date,
        stats: {
            totalUrls: Number,
            responseCodeTotals: [{ code: Number, count: Number }],
        },
        results: [
            {
                url: String,
                redirectDestination: String,
                response: Number,
            },
        ],
    },
});

const Site = model<ISite>("Site", siteSchema);

export default Site;
