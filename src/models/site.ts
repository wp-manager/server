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
        startTime: Number,
        endTime: Number,
        status: String,
        stats: {
            total: Number,
            done: Number,
            responseCodeTotals: [{ code: Number, count: Number }],
        },
        results: [
            {
                url: String,
                response: Number,
                responseText: String,
                redirect: String,
                inlinks: [String],
                outlinks: [String],
            },
        ],
    },
});

const Site = model<ISite>("Site", siteSchema);

export default Site;
