import { ISite } from "./site";

interface IUser {
    email: string;
    password: string;
    sites: ISite[];
}

export { IUser }