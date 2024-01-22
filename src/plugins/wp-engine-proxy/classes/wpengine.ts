type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

class WPEngineAPI {
    private readonly uri: string;
    private readonly auth: string;

    public requestInfo;

    constructor(auth: string) {
        this.auth = auth;
    }

    async request(method: Method, path: string, params?: object, body?: any): Promise<Response> {
        const url = new URL(`https://api.wpengineapi.com/v1/${path}`);

        const headers = {
            Authorization: `Basic ${this.auth}`,
            'Content-Type': 'application/json',
        };

        const requestOptions = {
            method,
            headers
        };

        if (body) {
            // body could be a string or an object. Ensure that a string is present or the object has data
            if (typeof body === 'string' || (typeof body === 'object' && Object.keys(body).length > 0)) {
                requestOptions['body'] = JSON.stringify(body);
            }
        }

        if (params) {
            Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
        }

        this.requestInfo = {
            url: url.toString(),
            requestOptions,
        };

        return fetch(url.toString(), requestOptions);
       
    }
}

export default WPEngineAPI;