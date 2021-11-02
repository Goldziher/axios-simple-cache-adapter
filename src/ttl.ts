import { AXIOS_CACHE } from './constants';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { parse } from 'cache-control-parser';

export function parseCacheControlHeader(
    response: AxiosResponse,
): number | null {
    for (const [key, value] of Object.entries(response.headers)) {
        if (key.toLowerCase() === 'cache-control') {
            const cacheControl = parse(value as string);
            return cacheControl['s-maxage'] ?? cacheControl['max-age'] ?? null;
        }
    }
    return null;
}

export function getCacheTTL(
    config: AxiosRequestConfig,
    response: AxiosResponse,
    defaultTTL?: number,
): number | null {
    const configTTL = Reflect.get(config, AXIOS_CACHE) as unknown;
    if (typeof configTTL === 'number') {
        return configTTL;
    }
    if (typeof configTTL === 'boolean') {
        return configTTL && defaultTTL ? defaultTTL : null;
    }
    return parseCacheControlHeader(response);
}
