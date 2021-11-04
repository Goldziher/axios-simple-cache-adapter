import { AxiosCacheRequestConfig, createCacheAdapter } from '../src';
import { CacheService } from '../src/cache';
import { ONE_SECOND_IN_MS } from '../src/constants';
import httpAdapter from 'axios/lib/adapters/http';

jest.mock('axios/lib/adapters/http');

describe('axiosCacheAdapter tests (node)', () => {
    const cacheGetSpy = jest.spyOn(CacheService.prototype, 'get');
    const cacheSetSpy = jest.spyOn(CacheService.prototype, 'set');
    const url = 'test/some-sub-path/?params';
    const config: AxiosCacheRequestConfig = { url, method: 'get' };
    const data = { value: 'test' };
    const response = {
        data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        request: {},
    };
    const maxAge = 10;
    const cacheAdapter = createCacheAdapter();

    beforeEach(() => {
        jest.resetAllMocks();
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

    it('uses the axios HTTP adapter in node', async () => {
        await cacheAdapter(config);
        expect(httpAdapter).toHaveBeenCalledWith(config);
    });
    it('does not cache a response without cache-control headers or AXIOS_CACHE', async () => {
        await cacheAdapter(config);
        expect(cacheSetSpy).not.toHaveBeenCalled();
    });
    it.each(['max-age', 's-maxage'])(
        'caches a response when cache-control %s instruction is present',
        async (instruction: string) => {
            const responseWithHeader = {
                ...response,
                headers: {
                    'cache-control': `public, ${instruction}=${maxAge}`,
                },
            };
            (httpAdapter as jest.Mock).mockImplementationOnce(async () =>
                Promise.resolve(responseWithHeader),
            );
            await cacheAdapter(config);
            expect(cacheSetSpy).toHaveBeenCalled();
        },
    );
    describe.each(['put', 'patch', 'delete', 'post', undefined])(
        'method handling - %s',
        (method: any) => {
            it('does not hit cache for method: %s', async () => {
                await cacheAdapter({ ...config, method });
                expect(cacheGetSpy).not.toHaveBeenCalled();
            });
            it('does not set cache for responses returned for method: %s', async () => {
                await cacheAdapter({ ...config, method });
                expect(cacheGetSpy).not.toHaveBeenCalled();
            });
        },
    );
    describe.each([true, false])('debug = %s', (debug) => {
        const debugAdapter = createCacheAdapter({
            debug,
        });
        const consoleSpy = jest.spyOn(console, 'log');
        it(`${
            debug ? 'logs' : 'does not log'
        } when hitting cache`, async () => {
            cacheGetSpy.mockImplementationOnce(async () =>
                Promise.resolve(response),
            );
            await debugAdapter(config);
            if (debug) {
                expect(consoleSpy).toHaveBeenCalled();
            } else {
                expect(consoleSpy).not.toHaveBeenCalled();
            }
        });
        it(`${
            debug ? 'logs' : 'does not log'
        } when setting cache`, async () => {
            cacheGetSpy.mockImplementationOnce(async () =>
                Promise.resolve(null),
            );
            await debugAdapter({
                ...config,
                cache: ONE_SECOND_IN_MS,
            });
            if (debug) {
                expect(consoleSpy).toHaveBeenCalled();
            } else {
                expect(consoleSpy).not.toHaveBeenCalled();
            }
        });
    });
});
