import { AxiosRequestHeaders, AxiosResponse } from 'axios';
import cacheManager from 'cache-manager';
import { parse } from 'flatted';

import { AxiosCacheObject, AxiosCacheStorage } from '../src';
import { CacheService, isStorageLike } from '../src/cache';

const memoryCache = cacheManager.caching('memory', {
    max: 100,
    ttl: 100_000,
});

describe.each([memoryCache, undefined])(
    'CacheService Tests (node)',
    async (storage) => {
        const url = 'test/';

        async function getStorage(): Promise<AxiosCacheStorage> {
            const cache = await storage;
            return cache as AxiosCacheStorage;
        }

        const cache = new CacheService(
            isStorageLike(storage) ? storage : await getStorage(),
        );

        const data = { value: 'testValue' };
        const response = {
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: { headers: {} as AxiosRequestHeaders },
            request: {},
        } satisfies AxiosResponse;
        const ttl = 100;

        beforeAll(() => {
            vi.useFakeTimers();
        });

        afterAll(() => {
            vi.useRealTimers();
        });

        afterEach(async () => {
            await cache.del(url);
        });

        it('sets value with the correct TTL', async () => {
            await cache.set(url, response, ttl);
            const stringified = await (isStorageLike(cache.storage)
                ? cache.storage.getItem(`axios-cache::${url}`)
                : cache.storage.get(`axios-cache::${url}`));
            const cached = parse(stringified!) as AxiosCacheObject;
            expect(cached.value).toEqual(response);
            expect(cached.expiration).toEqual(Date.now() + ttl);
        });

        it('respects expiration', async () => {
            await cache.set(url, response, ttl);
            let cached = await cache.get(url);
            expect(cached).toEqual(response);
            vi.advanceTimersByTime(ttl + 1);
            cached = await cache.get(url);
            expect(cached).toBeNull();
        });
    },
);
