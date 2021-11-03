import { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios';
import { AxiosCacheOptions } from './types';
import { CacheService } from './cache';
import { ONE_SECOND_IN_MS } from './constants';
import { getCacheTTL } from './ttl';

function getAdapter(): AxiosAdapter {
    return (
        Object.prototype.toString.call(process) === '[object process]'
            ? require('axios/lib/adapters/http')
            : require('axios/lib/adapters/xhr')
    ) as AxiosAdapter;
}

export function createCacheAdapter({
    debug = false,
    logger = console,
    storage,
    defaultTTL,
}: AxiosCacheOptions = {}): AxiosAdapter {
    const cache = new CacheService(storage);
    const adapter = getAdapter();
    return async function (config: AxiosRequestConfig): Promise<AxiosResponse> {
        const isGetRequest = config.method?.toLowerCase() === 'get';
        const cachedResponse =
            isGetRequest && config.url ? await cache.get(config.url) : null;
        if (cachedResponse) {
            if (debug) {
                const msg = `[axios-cache] serving cached response for url: ${config.url}`;
                logger.log(msg);
            }
            return cachedResponse;
        } else {
            try {
                const response = await adapter(config);
                const ttl = getCacheTTL(config, response, defaultTTL);
                if (isGetRequest && ttl) {
                    if (debug) {
                        const msg = `[axios-cache] caching response for url: ${config.url}`;
                        logger.log(msg);
                    }
                    await cache.set(
                        response.config.url!,
                        response,
                        ttl * ONE_SECOND_IN_MS,
                    );
                }
                return Promise.resolve(response);
            } catch (e) {
                return Promise.reject(e);
            }
        }
    };
}
