import { Schema, model } from "mongoose"
import { ISiteAuth } from "../interfaces/auth";

const siteAuthSchema = new Schema<ISiteAuth>({
    site: {
        type: Schema.Types.ObjectId,
        ref: "Site",
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    auth: String,
});

const SiteAuth = model<ISiteAuth>("SiteAuth", siteAuthSchema);

export default SiteAuth;