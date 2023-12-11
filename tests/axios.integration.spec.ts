import axios from 'axios';
import { parse } from 'flatted';

import {
    AxiosCacheObject,
    AxiosCacheRequestConfig,
    createCacheAdapter,
} from '../src';
import { ONE_SECOND_IN_MS } from '../src/constants';

describe(
    'axios integration tests',
    () => {
        const init = Date.now();
        const pokeAPI = 'https://pokeapi.co/api/v2/';
        const subPath = 'pokemon/ditto';

        const store = new Map<string, string>();
        const testStorage = {
            getItem(key: string): string | null {
                return store.get(key) ?? null;
            },
            removeItem(key: string): void {
                store.delete(key);
            },
            setItem(key: string, value: string): void {
                store.set(key, value);
            },
        };

        afterAll(() => {
            vi.useRealTimers();
        });

        it('caches responses', async () => {
            vi.setSystemTime(init);
            const cacheTTL = 10 * ONE_SECOND_IN_MS;
            const requestConfig = {
                cache: cacheTTL,
            } as AxiosCacheRequestConfig;
            const adapter = createCacheAdapter({
                storage: testStorage,
            });
            const instance = axios.create({ adapter, baseURL: pokeAPI });
            const response = await instance.get(subPath, requestConfig);

            expect(response.status).toBe(200);
            expect(response.data).toBeInstanceOf(Object);
            expect('abilities' in response.data).toBeTruthy();

            const cached = testStorage.getItem(
                `axios-cache::${pokeAPI}${subPath}`,
            );

            expect(cached).toBeTruthy();

            const getItemSpy = vi
                .spyOn(testStorage, 'getItem')
                .mockImplementation(() => cached);
            const { expiration } = parse(cached!) as AxiosCacheObject;
            expect(expiration).toEqual(init + cacheTTL);
            expect(expiration > Date.now()).toBeTruthy();

            let count = 0;
            while (Date.now() < expiration) {
                count++;
                vi.setSystemTime(init + count * ONE_SECOND_IN_MS);
                if (Date.now() < expiration) {
                    const cachedResponse = await instance.get(
                        subPath,
                        requestConfig,
                    );
                    expect(getItemSpy).toHaveBeenCalledTimes(count);
                    expect(
                        JSON.parse(JSON.stringify(cachedResponse)),
                    ).toMatchObject(
                        JSON.parse(
                            JSON.stringify({
                                ...response,
                                request: {},
                            }),
                        ),
                    );
                }
            }
        });
    },
    { timeout: 60 * ONE_SECOND_IN_MS },
);
