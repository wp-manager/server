import { IUser } from "./user";

interface ISite {
    uri: string;
    user: IUser;
    auth: string;
}

export { ISite }