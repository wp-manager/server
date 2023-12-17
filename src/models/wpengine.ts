import { Schema, model } from "mongoose";
import { IWPEngineInstall, IWPEngineSite } from "../interfaces/wpengine";
import { IWPEngineAuth } from "../interfaces/auth";

const wpengineSiteSchema = new Schema<IWPEngineSite>({
    id: String,
    name: String,
    account: String,
    installs: [
        {
            id: String,
            name: String,
            environment: String,
        },
    ],
});

const wpengineInstallSchema = new Schema<IWPEngineInstall>({
    id: String,
    name: String,
    environment: String,
    site: { type: Schema.Types.ObjectId, ref: "WPEngineSite" },
});

const wpengineAuthSchema = new Schema<IWPEngineAuth>({
    user: { type: Schema.Types.ObjectId, ref: "User" },
    auth: String,
});

const WPEngineSite = model<IWPEngineSite>("WPEngineSite", wpengineSiteSchema);
const WPEngineInstall = model<IWPEngineInstall>(
    "WPEngineInstall",
    wpengineInstallSchema
);
const WPEngineAuth = model<IWPEngineAuth>("WPEngineAuth", wpengineAuthSchema);

export { WPEngineSite, WPEngineInstall, WPEngineAuth };
