/**
 * @jest-environment jsdom
 */
import { AxiosRequestConfig } from 'axios';
import xhrAdapter from 'axios/lib/adapters/xhr';

import { AxiosCacheStorage, createCacheAdapter } from '../src';

jest.mock('axios/lib/adapters/xhr');

describe('axiosCacheAdapter tests (jsdom)', () => {
    const url = 'test/some-sub-path/?params';
    const config: AxiosRequestConfig = { url, method: 'get' };
    const mockStorage: AxiosCacheStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
    };
    const cacheAdapter = createCacheAdapter({ storage: mockStorage });

    it('uses the axios XHR adapter in the browser', async () => {
        (xhrAdapter as jest.Mock).mockImplementationOnce(async () =>
            Promise.resolve({ headers: {} }),
        );
        await cacheAdapter(config);
        expect(xhrAdapter).toHaveBeenCalledWith(config);
    });
});
