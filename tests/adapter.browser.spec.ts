import { Axios, AxiosRequestHeaders, InternalAxiosRequestConfig } from 'axios';

import { AxiosCacheStorage, createCacheAdapter } from '../src';

const mockAdapter = vi.fn();
vi.mock('axios', async () => {
    const actual = await vi.importActual<Axios>('axios');
    return {
        ...actual,
        getAdapter: vi.fn().mockImplementation(() => mockAdapter),
    };
});

describe('axiosCacheAdapter tests (jsdom)', () => {
    const url = 'test/some-sub-path/?params';
    const config: InternalAxiosRequestConfig = {
        headers: {} as AxiosRequestHeaders,
        method: 'get',
        url,
    };
    const mockStorage: AxiosCacheStorage = {
        getItem: vi.fn().mockImplementation(() => Promise.resolve(null)),
        removeItem: vi.fn(),
        setItem: vi.fn(),
    };
    const cacheAdapter = createCacheAdapter({ storage: mockStorage });

    it('uses the axios XHR adapter in the browser', async () => {
        await cacheAdapter(config);
        expect(mockAdapter).toHaveBeenCalledWith(config);
    });
});
