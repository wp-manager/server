import { ISite } from "./site";
import { IUser } from "./user";
import { IWPEngineSite } from "./wpengine";

interface ISiteAuth {
    user: IUser;
    site: ISite;
    auth: string;
}

interface IWPEngineAuth {
    user: IUser;
    auth: string;
}

// TODO: Cloudflare, Bitbucket, Github, etc.

export { ISiteAuth, IWPEngineAuth }