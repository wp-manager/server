import { ISite } from "../../../interfaces/site";
import { IUser } from "../../../interfaces/user";

interface IWPEngineUserSite {
    user: IUser
    site: ISite;
    siteId: string;
    installId: string;
}

export { IWPEngineUserSite }