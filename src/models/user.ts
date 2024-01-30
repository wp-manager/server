import { Schema, model } from "mongoose"
import { IUser } from "../interfaces/user";

const userSchema = new Schema<IUser>({
    email: String,
    password: String,
    sites: [{
        type: Schema.Types.ObjectId,
        ref: "Site",
    }],
    plugins: [{
        path: String,
    }],
});

const User = model<IUser>("User", userSchema);

export default User;