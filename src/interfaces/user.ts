import { ISite } from "./site";

interface IUser {
    email: string;
    password: string;
    sites: ISite[];
    plugins: { path: string }[];
}

export { IUser }