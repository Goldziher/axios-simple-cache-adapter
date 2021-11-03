import { AXIOS_CACHE, AxiosCacheStorage, createCacheAdapter } from '../src';
import { AxiosRequestConfig } from 'axios';
import { ONE_SECOND_IN_MS } from '../src/constants';
import httpAdapter from 'axios/lib/adapters/http';
import xhrAdapter from 'axios/lib/adapters/xhr';

jest.mock('axios/lib/adapters/http');
jest.mock('axios/lib/adapters/xhr');

describe('axiosCacheAdapter', () => {
    const url = 'test/some-sub-path/?params';
    const cacheKey = `axios-cache::${url}`;
    const config: AxiosRequestConfig = { url, method: 'get' };
    const data = { value: 'test' };
    const response = {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
    };
    const mockStorage: AxiosCacheStorage = {
        getItem: jest.fn(() => JSON.stringify(response)),
        setItem: jest.fn(),
        removeItem: jest.fn(),
    };
    const maxAge = 10;
    const cacheAdapter = createCacheAdapter({ storage: mockStorage });

    beforeEach(() => {
        jest.resetAllMocks();
        (xhrAdapter as jest.Mock).mockImplementation(async () =>
            Promise.resolve(response),
        );
        (httpAdapter as jest.Mock).mockImplementation(async () =>
            Promise.resolve(response),
        );
    });

    beforeAll(() => {
        jest.useFakeTimers();
    });

    afterAll(() => {
        jest.useRealTimers();
    });

    it.each(['max-age', 's-maxage'])(
        'caches a response when cache-control %s header is present',
        async (header: string) => {
            const responseWithHeader = {
                ...response,
                headers: { 'cache-control': `public, ${header}=${maxAge}` },
            };
            (xhrAdapter as jest.Mock).mockImplementationOnce(async () =>
                Promise.resolve(responseWithHeader),
            );
            (httpAdapter as jest.Mock).mockImplementationOnce(async () =>
                Promise.resolve(responseWithHeader),
            );
            await cacheAdapter(config);
            expect(mockStorage.setItem).toHaveBeenCalled();
            const [call] = (mockStorage.setItem as jest.Mock).mock.calls;
            expect(call[0]).toBe(cacheKey);
            expect(JSON.parse(call[1])).toEqual({
                value: responseWithHeader,
                expiration: new Date().getTime() + ONE_SECOND_IN_MS * maxAge,
            });
        },
    );
    it('does not cache a response when no cache-control headers are present', async () => {
        await cacheAdapter(config);
        expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it('respects default TTL when AXIOS_CACHE is set to true in request config', async () => {
        const adapterWithDefaultTTL = createCacheAdapter({
            defaultTTL: ONE_SECOND_IN_MS,
            storage: mockStorage,
        });
        await adapterWithDefaultTTL({ ...config, [AXIOS_CACHE]: true } as any);
        expect(mockStorage.setItem).toHaveBeenCalled();
        const [call] = (mockStorage.setItem as jest.Mock).mock.calls;
        expect(call[0]).toBe(cacheKey);
        expect(JSON.parse(call[1])).toEqual({
            value: response,
            expiration: new Date().getTime() + ONE_SECOND_IN_MS,
        });
    });
    it('respects AXIOS_CACHE value when set', async () => {
        await cacheAdapter({
            ...config,
            [AXIOS_CACHE]: ONE_SECOND_IN_MS,
        } as any);
        expect(mockStorage.setItem).toHaveBeenCalled();
        const [call] = (mockStorage.setItem as jest.Mock).mock.calls;
        expect(call[0]).toBe(cacheKey);
        expect(JSON.parse(call[1])).toEqual({
            value: response,
            expiration: new Date().getTime() + ONE_SECOND_IN_MS,
        });
    });
    describe('debug', () => {
        it('writes to console when serving cache when debug is set as true', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            (mockStorage.getItem as jest.Mock).mockReturnValueOnce(
                JSON.stringify({
                    value: response,
                    expiration: new Date().getTime() + ONE_SECOND_IN_MS,
                }),
            );
            const debugAdapter = createCacheAdapter({
                storage: mockStorage,
                debug: true,
            });
            await debugAdapter(config);
            expect(consoleSpy).toHaveBeenCalledTimes(1);
        });
        it('writes to console when setting cache when debug is set as true', async () => {
            const consoleSpy = jest.spyOn(console, 'log');
            const debugAdapter = createCacheAdapter({
                storage: mockStorage,
                debug: true,
            });
            await debugAdapter({
                ...config,
                [AXIOS_CACHE]: ONE_SECOND_IN_MS,
            } as any);
            expect(consoleSpy).toHaveBeenCalledTimes(1);
        });
    });
});
