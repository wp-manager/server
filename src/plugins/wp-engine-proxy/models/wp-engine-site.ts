import { Schema, model } from "mongoose"
import { IWPEngineUserSite } from "../interfaces/wp-engine-user-site";

const wpEngineUserSiteSchema = new Schema<IWPEngineUserSite>({
    user: {
        type: Schema.Types.ObjectId,
    },
    site: {
        type: Schema.Types.ObjectId,
    },
    siteId: String,
    installId: String,
});

const WPEngineUserSite = model<IWPEngineUserSite>("WPEngineUserSite", wpEngineUserSiteSchema);

export default WPEngineUserSite;