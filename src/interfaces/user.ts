import { ISiteAuth, IWPEngineAuth } from "./auth";
import { ISite } from "./site";

interface IUser {
    email: string;
    password: string;
    sites: ISite[];
    wpengineAuth: IWPEngineAuth;
}

export { IUser }