import User from "../models/user";

const getUser = async () => {
    return await User.findOne({
        username: "MrDarrenGriffin",
    });
}

const getAuthdUser = async (req, res) => {
    let user = await getUser();
    // only include id and username
    res.json({
        id: user.id,
        username: user.username,
    });
}

export {
    getAuthdUser,
    getUser
}