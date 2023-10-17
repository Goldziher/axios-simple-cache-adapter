import { isBoolean, isNumber } from '@tool-belt/type-predicates';
import { AxiosResponse } from 'axios';
import { parse } from 'cache-control-parser';

import { ONE_SECOND_IN_MS } from './constants';
import { AxiosCacheRequestConfig } from './types';

export function parseCacheControlHeader(
    response: AxiosResponse = {} as AxiosResponse,
): number | null {
    const { headers = {} } = response;
    for (const [key, value] of Object.entries(headers)) {
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
    config: AxiosCacheRequestConfig;
    response: AxiosResponse;
    defaultTTL?: number;
}): number | null {
    const { cache } = config;
    if (isBoolean(cache)) {
        if (!cache) {
            return null;
        }
        if (defaultTTL) {
            return defaultTTL;
        }
    }
    if (isNumber(cache) && cache > 0) {
        return cache;
    }
    if (parseHeaders) {
        return parseCacheControlHeader(response);
    }
    return null;
}
