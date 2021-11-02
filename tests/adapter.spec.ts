import { AxiosCacheStorage, createCacheAdapter } from '../src';
import { AxiosRequestConfig } from 'axios';
import { ONE_SECOND_IN_MS } from '../src/constants';
import httpAdapter from 'axios/lib/adapters/http';
import xhrAdapter from 'axios/lib/adapters/xhr';

jest.mock('axios/lib/adapters/http');
jest.mock('axios/lib/adapters/xhr');

describe('axiosCacheAdapter', () => {
    const url = 'test/some-sub-path/?params';
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
            expect(call[0]).toBe(url);
            expect(JSON.parse(call[1])).toEqual({
                value: responseWithHeader,
                expiration: new Date().getTime() + ONE_SECOND_IN_MS * maxAge,
            });
        },
    );
    it('does not cache a response when no cache-control headers are present', async () => {
        (xhrAdapter as jest.Mock).mockImplementationOnce(async () =>
            Promise.resolve(response),
        );
        (httpAdapter as jest.Mock).mockImplementationOnce(async () =>
            Promise.resolve(response),
        );
        await cacheAdapter(config);
        expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
});
