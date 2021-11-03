import { AXIOS_CACHE, ONE_SECOND_IN_MS } from './constants';
import { AxiosRequestConfig, AxiosResponse } from 'axios';
import { isBoolean, isNumber } from '@tool-belt/type-predicates';
import { parse } from 'cache-control-parser';

export function parseCacheControlHeader(
    response: AxiosResponse,
): number | null {
    for (const [key, value] of Object.entries(response.headers)) {
        if (key.toLowerCase() === 'cache-control') {
            const cacheControl = parse(value as string);
            const maxAge = cacheControl['s-maxage'] ?? cacheControl['max-age'];
            if (maxAge) {
                return maxAge * ONE_SECOND_IN_MS;
            }
        }
    }
    return null;
}

export function getCacheTTL({
    parseHeaders,
    config,
    response,
    defaultTTL,
}: {
    parseHeaders: boolean;
    config: AxiosRequestConfig;
    response: AxiosResponse;
    defaultTTL?: number;
}): number | null {
    const configTTL = Reflect.get(config, AXIOS_CACHE) as unknown;
    if (isBoolean(configTTL)) {
        if (!configTTL) {
            return null;
        } else if (defaultTTL) {
            return defaultTTL;
        }
    } else if (isNumber(configTTL)) {
        return configTTL;
    } else if (parseHeaders) {
        return parseCacheControlHeader(response);
    }
    return null;
}
