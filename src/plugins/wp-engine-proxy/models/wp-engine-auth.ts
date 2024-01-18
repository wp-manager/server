import { Schema, model } from "mongoose"
import { IWPEngineAuth } from "../interfaces/wp-engine-auth";

const wpEngineAuthSchema = new Schema<IWPEngineAuth>({
    user: {
        type: Schema.Types.ObjectId,
    },
    auth: String,
});

const WPEngineAuth = model<IWPEngineAuth>("WPEngineAuth", wpEngineAuthSchema);

export default WPEngineAuth;