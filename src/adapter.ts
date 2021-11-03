import { AxiosCacheOptions } from './types';
import { CacheService } from './cache';
import { getCacheTTL } from './ttl';
import axios, { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';

function getAdapter(): AxiosAdapter {
    return (
        Object.prototype.toString.call(process) === '[object process]'
            ? require('axios/lib/adapters/http')
            : require('axios/lib/adapters/xhr')
    ) as AxiosAdapter;
}

export function createCacheAdapter({
    debug = false,
    parseHeaders = true,
    logger = console,
    storage,
    defaultTTL,
}: AxiosCacheOptions = {}): AxiosAdapter {
    const cache = new CacheService(storage);
    const adapter = getAdapter();
    return async function (config: AxiosRequestConfig): Promise<AxiosResponse> {
        const isGetRequest = config.method?.toLowerCase() === 'get';
        const url = axios.getUri(config);
        const cachedResponse = isGetRequest ? await cache.get(url) : null;
        if (cachedResponse) {
            if (debug) {
                const msg = `[axios-cache] serving cached response for url: ${url}`;
                logger.log(msg);
            }
            return cachedResponse;
        } else {
            const response = await adapter(config);
            const ttl = getCacheTTL({
                config,
                response,
                defaultTTL,
                parseHeaders,
            });
            if (isGetRequest && ttl) {
                if (debug) {
                    const msg = `[axios-cache] caching response for url: ${url}`;
                    logger.log(msg);
                }
                await cache.set(url, response, ttl);
            }
            return response;
        }
    };
}
