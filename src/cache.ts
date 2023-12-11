import { isObject, isPromise } from '@tool-belt/type-predicates';
import { AxiosResponse } from 'axios';
import { parse, stringify } from 'flatted';

import {
    AsyncMapLikeCache,
    AsyncStorageLikeCache,
    AxiosCacheObject,
    AxiosCacheStorage,
    MapLikeCache,
    StorageLikeCache,
} from './types';

export function isStorageLike(
    storage: unknown,
): storage is StorageLikeCache | AsyncStorageLikeCache {
    return isObject(storage) && Reflect.has(storage, 'getItem');
}

export function isMapLike(
    storage: unknown,
): storage is MapLikeCache | AsyncMapLikeCache {
    return isObject(storage) && Reflect.has(storage, 'delete');
}

export class CacheService {
    public readonly storage: AxiosCacheStorage;
    constructor(storage?: AxiosCacheStorage) {
        if (storage) {
            this.storage = storage;
        } else {
            this.storage =
                typeof localStorage === 'undefined' ? new Map() : localStorage;
        }
    }

    async get(key: string): Promise<AxiosResponse | null> {
        const cacheKey = this.cacheKey(key);
        let cached = isStorageLike(this.storage)
            ? this.storage.getItem(cacheKey)
            : this.storage.get(cacheKey);
        if (isPromise(cached)) {
            cached = await Promise.resolve(cached);
        }
        if (cached) {
            const { expiration, value } = parse(cached) as AxiosCacheObject;
            if (
                !Number.isNaN(Number(expiration)) &&
                Number(expiration) < Date.now()
            ) {
                await this.del(cacheKey);
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
        const cacheKey = this.cacheKey(key);
        const value = stringify({
            expiration: Date.now() + ttl,
            value: {
                ...response,
                config: { headers },
                request: {},
            },
        });
        const setItem = (
            isStorageLike(this.storage)
                ? this.storage.setItem(cacheKey, value)
                : this.storage.set(cacheKey, value)
        ) as unknown;
        if (isPromise(setItem)) {
            await setItem;
        }
    }

    async del(key: string): Promise<void> {
        const removeItem = (
            isStorageLike(this.storage)
                ? this.storage.removeItem(key)
                : isMapLike(this.storage)
                  ? this.storage.delete(key)
                  : this.storage.del(key)
        ) as unknown;
        if (isPromise(removeItem)) {
            await removeItem;
        }
    }

    private cacheKey(key: string): string {
        return `axios-cache::${key}`;
    }
}
