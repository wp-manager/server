import { Schema, model } from "mongoose"
import { ISite } from "../interfaces/site";

const siteSchema = new Schema<ISite>({
    uri: String,
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
    },
    auth: String,
    wpengineInstall: {
        type: Schema.Types.ObjectId,
        ref: "WPEngineInstall",
    }
});

const Site = model<ISite>("Site", siteSchema);

export default Site;