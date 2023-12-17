import { ISite } from "./site";
import { IUser } from "./user";

interface IWPEngineInstall {
    id: string;
    name: string;
    environment: 'development' | 'staging' | 'production';
    site: ISite;
}

interface IWPEngineSite {
    id: string;
    name: string;
    account: string;
    installs: IWPEngineInstall[];

}

export { IWPEngineSite, IWPEngineInstall }