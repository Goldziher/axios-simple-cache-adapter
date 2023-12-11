/**
 * @vitest-environment jsdom
 */

import { AxiosRequestHeaders, AxiosResponse } from 'axios';
import { parse } from 'flatted';
import localForage from 'localforage';

import { AxiosCacheObject } from '../src';
import { CacheService, isStorageLike } from '../src/cache';

describe.each([sessionStorage, localForage, undefined])(
    'CacheService Tests (jsdom)',
    (storage) => {
        const url = 'test/';
        const cache = new CacheService(storage);
        const data = { value: 'testValue' };
        const response = {
            config: { headers: {} as AxiosRequestHeaders },
            data,
            headers: {},
            request: {},
            status: 200,
            statusText: 'OK',
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
