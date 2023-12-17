import { ISiteAuth, IWPEngineAuth } from "./auth";
import { ISite } from "./site";

interface IUser {
    username: string;
    sites: ISite[];
    wpengineAuth: IWPEngineAuth;
}

export { IUser }