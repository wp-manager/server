import { IUser } from "./user";
import { IWPEngineInstall } from "./wpengine";

interface ISite {
    uri: string;
    user: IUser;
    auth: string;
    wpeInstallId: string;
}

export { ISite }