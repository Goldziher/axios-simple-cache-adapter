import {
    AsyncAxiosCacheStorage,
    AxiosCacheObject,
    AxiosCacheStorage,
} from './types';
import { AxiosResponse } from 'axios';
import { LocalStorage as NodeLocalStorage } from 'node-localstorage';
import { isPromise } from '@tool-belt/type-predicates';
import { parse, stringify } from 'flatted';

export class CacheService {
    public readonly storage: AxiosCacheStorage | AsyncAxiosCacheStorage;

    constructor(storage?: AxiosCacheStorage | AsyncAxiosCacheStorage) {
        if (storage) {
            this.storage = storage;
        } else {
            this.storage =
                typeof localStorage !== 'undefined'
                    ? localStorage
                    : new NodeLocalStorage('AxiosCache');
        }
    }

    async get(key: string): Promise<AxiosResponse | null> {
        let cached = this.storage.getItem(this.cacheKey(key));
        if (isPromise(cached)) {
            cached = await Promise.resolve(cached);
        }
        if (cached) {
            const { expiration, value } = parse(cached) as AxiosCacheObject;
            if (
                !Number.isNaN(Number(expiration)) &&
                Number(expiration) < new Date().getTime()
            ) {
                const removeItem = this.storage.removeItem(this.cacheKey(key));
                if (isPromise(removeItem)) {
                    await removeItem;
                }
                return null;
            }
            return value;
        }
        return null;
    }

    async set(
        key: string,
        { config: { headers }, ...response }: AxiosResponse,
        ttl: number,
    ): Promise<void> {
        const setItem = this.storage.setItem(
            this.cacheKey(key),
            stringify({
                expiration: new Date().getTime() + ttl,
                value: {
                    ...response,
                    config: { headers },
                    request: {},
                },
            }),
        );
        if (isPromise(setItem)) {
            await setItem;
        }
    }

    private cacheKey(key: string): string {
        return `axios-cache::${key}`;
    }
}
