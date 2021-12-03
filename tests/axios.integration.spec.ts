import axios from 'axios';
import { parse } from 'flatted';

import {
    AxiosCacheObject,
    AxiosCacheRequestConfig,
    createCacheAdapter,
} from '../src';
import { ONE_SECOND_IN_MS } from '../src/constants';

describe('axios integration tests', () => {
    jest.setTimeout(60 * ONE_SECOND_IN_MS);
    const init = new Date().getTime();
    const pokeAPI = 'https://pokeapi.co/api/v2/';
    const subPath = 'pokemon/ditto';

    const store = new Map<string, string>();
    const testStorage = {
        getItem(key: string): string | null {
            return store.get(key) ?? null;
        },
        setItem(key: string, value: string): void {
            store.set(key, value);
        },
        removeItem(key: string): void {
            store.delete(key);
        },
    };

    afterAll(() => {
        jest.useRealTimers();
    });

    it('caches responses', async () => {
        jest.useFakeTimers();
        jest.setSystemTime(init);
        const cacheTTL = 10 * ONE_SECOND_IN_MS;
        const requestConfig = {
            cache: cacheTTL,
        } as AxiosCacheRequestConfig;
        const adapter = createCacheAdapter({
            storage: testStorage,
        });
        const instance = axios.create({ baseURL: pokeAPI, adapter });
        const response = await instance.get(subPath, requestConfig);
        expect(response.status).toBe(200);
        expect(response.data).toBeInstanceOf(Object);
        expect('abilities' in response.data).toBeTruthy();
        const cached = testStorage.getItem('axios-cache::' + subPath);
        expect(cached).toBeTruthy();

        const getItemSpy = jest
            .spyOn(testStorage, 'getItem')
            .mockImplementation(() => cached);
        const { expiration } = parse(cached!) as AxiosCacheObject;
        expect(expiration).toEqual(init + cacheTTL);
        expect(expiration > new Date().getTime()).toBeTruthy();

        let count = 0;
        while (new Date().getTime() < expiration) {
            count++;
            jest.setSystemTime(init + count * ONE_SECOND_IN_MS);
            if (new Date().getTime() < expiration) {
                const cachedResponse = await instance.get(
                    subPath,
                    requestConfig,
                );
                expect(getItemSpy).toHaveBeenCalledTimes(count);
                expect(cachedResponse).toEqual({
                    ...response,
                    request: {},
                });
            }
        }
    });
});
