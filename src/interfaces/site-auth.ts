import { ISite } from "./site"
import { IUser } from "./user"

interface ISiteAuth {
    site: ISite;
    user: IUser;
    auth: string;
}

export { ISiteAuth }