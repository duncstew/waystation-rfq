import { API_URL } from "config";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface IOptions extends RequestInit {}

class FetchJson {
    private _baseUrl: string;
    private _options: IOptions;

    /**
     * Creates an instance of FetchJson.
     * @param baseUrl The base URL to prefix on all API calls
     * @param options Optional option overrides (see standard fetch options)
     */
    constructor(baseUrl: string, options: IOptions = {}) {
        this._baseUrl = baseUrl;
        this._options = options;
    }

    /**
     * Private implementation for making API requests
     *
     * @private
     * @param method GET, POST, etc
     * @param url URL to make the request to
     * @param [data] Either an object to be serialized in the body or to be put into the query string for GET requests
     * @returns A promise that
     */
    private async request(method: string, url: string, data?: unknown) {
        const settings: IOptions = {
            method: method.toUpperCase(),
            ...this._options,
        };

        url = `${this._baseUrl}${url}`; // Set this to our app url + url from request caller
        const isGetRequest = settings.method === "GET";

        const headers: Record<string, string> = {
            accept: "application/json",
        };

        if (data) {
            if (isGetRequest) {
                const params = data as Record<string, string>;
                const paramKeys = Object.keys(params);
                if (paramKeys && paramKeys.length) {
                    url =
                        url +
                        (url.includes("?") ? "&" : "?") +
                        paramKeys.map((key) => `${key}=${encodeURIComponent(params[key])}`).join("&");
                }
            } else {
                headers["Content-Type"] = "application/json";
                settings.body = JSON.stringify(data);
            }
        }

        settings.headers = headers;

        const response = await fetch(url, settings);

        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({
                detail: response.statusText,
            }));
            console.error(`API Error: ${response.status} ${response.statusText}`, errorBody);
            throw new Error(errorBody.detail || `Request failed with status ${response.status}`);
        }

        if (response.status === 204) {
            // No content to return
            return;
        }

        return await response.json();
    }

    /**
     * Make a GET api request
     *
     * @template T The type of object that will be returned by the API call
     * @param url The URL for the request
     * @param [params] Key/value pairs to be included on the querystring
     * @returns The object returned by the API call
     */
    public async get<T>(url: string, params?: Record<string, string>): Promise<T> {
        return await this.request("GET", url, params);
    }

    /**
     * Make a POST api request
     *
     * @template T The type of the object that will be returned by the API call
     * @param url The URL for the request
     * @param [data] An object to be serialized and included in the request body
     * @returns The object returned by the API call
     */
    public async post<T>(url: string, data?: unknown): Promise<T> {
        return await this.request("POST", url, data);
    }

    /**
     * Make a PUT api request
     *
     * @template T The type of the object that will be returned by the API call
     * @param url The URL for the request
     * @param [data] An object to be serialized and included in the request body
     * @returns The object returned by the API call
     */
    public async put<T>(url: string, data?: unknown): Promise<T> {
        return await this.request("PUT", url, data);
    }

    /**
     * Make a PATCH api request
     *
     * @template T The type of the object that will be returned by the API call
     * @param url The URL for the request
     * @param [data] An object to be serialized and included in the request body
     * @returns The object returned by the API call
     */
    public async patch<T>(url: string, data?: unknown): Promise<T> {
        return await this.request("PATCH", url, data);
    }

    /**
     * Make a DELETE api request
     *
     * @template T The type of the object that will be returned by the API call
     * @param url The URL for the request
     * @param [data] An object to be serialized and included in the request body
     * @returns The object returned by the API call
     */
    public async delete<T>(url: string, data?: unknown): Promise<T> {
        return await this.request("DELETE", url, data);
    }
}

// Assuming API_URL is correctly imported from a config file.
// If not, you might want to replace it with a hardcoded string or environment variable.
const api = new FetchJson(API_URL);
export default api;