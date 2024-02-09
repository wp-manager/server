import WPEngineAPI from "../classes/wpengine";
import WPEngineAuth from "../models/wp-engine-auth";

const proxy = async (req, res) => {

    const auth = await WPEngineAuth.findOne({
        user: req.user,
    });

    if (!auth) {
        return res.status(401).json({
            message: "No token found",
        });
    }

    
    let proxyPath = req.params[0];
    
    let wpeApi = new WPEngineAPI(auth.auth);

    // include ?a params
    await wpeApi
        .request(req.method, proxyPath, req.query, req.body)
        .then(async (response) => {
            if (!response.ok) {
                const body = await response.text();
                return res.status(response.status).send(body);
            }
            
            try {
                const body = await response.json();
                return res.status(response.status).json(body);
            } catch (e) {
                return res.status(response.status).send();
            }
        })
        .catch((error) => {
            console.error("Failed to proxy request", error);
            res.status(500).json({
                error: "Failed to proxy request",
            });
            return;
        });
    return;
};

export { proxy };
