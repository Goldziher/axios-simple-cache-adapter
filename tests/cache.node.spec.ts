/**
 * @jest-environment node
 */

import { AxiosCacheObject } from '../src';
import { CacheService, isStorageLike } from '../src/cache';
import { parse } from 'flatted';

describe('CacheService Tests (node)', () => {
    const url = 'test/';
    const cache = new CacheService();
    const data = { value: 'testValue' };
    const response = {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
        request: {},
    };
    const ttl = 100;

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
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
        expect(cached.expiration).toEqual(new Date().getTime() + ttl);
    });

    it('respects expiration', async () => {
        await cache.set(url, response, ttl);
        let cached = await cache.get(url);
        expect(cached).toEqual(response);
        jest.advanceTimersByTime(ttl + 1);
        cached = await cache.get(url);
        expect(cached).toBeNull();
    });
});
