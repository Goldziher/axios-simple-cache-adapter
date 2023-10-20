import {
    Axios,
    AxiosAdapter,
    AxiosRequestHeaders,
    AxiosResponse,
    getAdapter,
    InternalAxiosRequestConfig,
} from 'axios';
import { Mock, SpyInstance } from 'vitest';

import { createCacheAdapter } from '../src';
import { CacheService } from '../src/cache';
import { ONE_SECOND_IN_MS } from '../src/constants';

const mockAdapter = vi.fn();
vi.mock('axios', async () => {
    const actual = await vi.importActual<Axios>('axios');
    return {
        ...actual,
        getAdapter: vi.fn().mockImplementation(() => mockAdapter),
    };
});

describe('axiosCacheAdapter tests (node)', () => {
    const url = 'test/some-sub-path/?params';
    const config: InternalAxiosRequestConfig = {
        url,
        method: 'get',
        headers: {} as AxiosRequestHeaders,
    };
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
    const cacheAdapterWithParseHeaders = createCacheAdapter({
        parseHeaders: true,
    });

    let httpAdapter: AxiosAdapter;
    let cacheGetSpy: SpyInstance;
    let cacheSetSpy: SpyInstance;

    beforeEach(() => {
        vi.clearAllMocks();

        cacheGetSpy = vi.spyOn(CacheService.prototype, 'get');
        cacheSetSpy = vi.spyOn(CacheService.prototype, 'set');

        httpAdapter = getAdapter('http');
        (httpAdapter as Mock).mockImplementation(async () => response);
    });

    beforeAll(() => {
        vi.useFakeTimers();
    });

    afterAll(() => {
        vi.useRealTimers();
    });

    it('uses the axios HTTP adapter in node', async () => {
        await cacheAdapter(config);
        expect(mockAdapter).toHaveBeenCalledWith(config);
    });

    it('does not cache a response without cache-control headers or AXIOS_CACHE', async () => {
        await cacheAdapterWithParseHeaders(config);
        expect(cacheSetSpy).not.toHaveBeenCalled();
    });

    it.each(['max-age', 's-maxage'])(
        'caches a response when cache-control %s instruction is present',
        async (instruction: string) => {
            cacheGetSpy.mockReturnValueOnce(null);
            const responseWithHeader = {
                ...response,
                headers: {
                    'cache-control': `public, ${instruction}=${maxAge}`,
                },
            };
            mockAdapter.mockImplementationOnce(async () => responseWithHeader);
            await cacheAdapterWithParseHeaders(config);
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
        const consoleSpy = vi.spyOn(console, 'log');

        it(`${
            debug ? 'logs' : 'does not log'
        } when hitting cache`, async () => {
            cacheGetSpy.mockImplementationOnce(async () => response);
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
            cacheGetSpy.mockImplementationOnce(
                async () => 'dummy' as unknown as Promise<AxiosResponse | null>,
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
