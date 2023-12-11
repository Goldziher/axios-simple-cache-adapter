import axios, { AxiosResponse, getAdapter } from 'axios';

import { CacheService } from './cache';
import { getCacheTTL } from './ttl';
import {
    AxiosCacheAdapter,
    AxiosCacheOptions,
    AxiosCacheRequestConfig,
} from './types';

export function createCacheAdapter({
    debug = false,
    parseHeaders = false,
    logger = console,
    storage,
    defaultTTL,
}: AxiosCacheOptions = {}): AxiosCacheAdapter {
    const cache = new CacheService(storage);
    const adapter = getAdapter(
        typeof XMLHttpRequest === 'undefined' ? 'http' : 'xhr',
    );

    return async function (
        config: AxiosCacheRequestConfig,
    ): Promise<AxiosResponse> {
        const isGetRequest = config.method?.toLowerCase() === 'get';
        const url = axios.getUri(config);

        const cachedResponse = isGetRequest ? await cache.get(url) : null;
        if (cachedResponse) {
            if (debug) {
                const msg = `[axios-cache] serving cached response for url: ${url}`;
                logger.log(msg);
            }
            return {
                ...cachedResponse,
                config: { ...config, ...cachedResponse.config },
            };
        }

        const response = await adapter(config);

        const ttl = getCacheTTL({
            config,
            defaultTTL,
            parseHeaders,
            response,
        });

        if (isGetRequest && ttl) {
            if (debug) {
                const msg = `[axios-cache] caching response for url: ${url} with TTL: ${ttl}`;
                logger.log(msg);
            }
            await cache.set(url, response, ttl);
        }

        return response;
    };
}
