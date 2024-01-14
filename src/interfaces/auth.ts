import { ISite } from "./site";
import { IUser } from "./user";

interface ISiteAuth {
    user: IUser;
    site: ISite;
    auth: string;
}

export { ISiteAuth }