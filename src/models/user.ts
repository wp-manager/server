import { Schema, model } from "mongoose"
import { IUser } from "../interfaces/user";

const userSchema = new Schema<IUser>({
    username: String,
    sites: [{
        type: Schema.Types.ObjectId,
        ref: "Site",
    }],
    wpengineAuth: {
        type: Schema.Types.ObjectId,
        ref: "WPEngineAuth",
    },
});

const User = model<IUser>("User", userSchema);

export default User;