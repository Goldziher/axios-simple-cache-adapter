import {
    AsyncAxiosCacheStorage,
    AxiosCacheObject,
    AxiosCacheStorage,
} from './types';
import { AxiosResponse } from 'axios';
import { LocalStorage as NodeLocalStorage } from 'node-localstorage';
import { isPromise } from '@tool-belt/type-predicates';

export class CacheService {
    public readonly storage: AxiosCacheStorage | AsyncAxiosCacheStorage;
    public readonly keys: string[] = [];

    constructor(storage?: AxiosCacheStorage | AsyncAxiosCacheStorage) {
        if (storage) {
            this.storage = storage;
        } else {
            this.storage =
                typeof window !== 'undefined' &&
                typeof localStorage !== 'undefined'
                    ? localStorage
                    : new NodeLocalStorage('AxiosCache');
        }
    }

    async get(key: string): Promise<AxiosResponse | null> {
        const index = this.keys.indexOf(key);
        let cached = index > -1 ? this.storage.getItem(key) : null;
        if (isPromise(cached)) {
            cached = await Promise.resolve(cached);
        }
        if (cached) {
            const { expiration, value } = JSON.parse(
                cached,
            ) as AxiosCacheObject;
            if (
                !Number.isNaN(Number(expiration)) &&
                Number(expiration) < new Date().getTime()
            ) {
                const removeItem = this.storage.removeItem(key);
                if (isPromise(removeItem)) {
                    await removeItem;
                }
                this.keys.splice(index, 1);
                return null;
            }
            return value;
        }
        return null;
    }

    async set(key: string, value: AxiosResponse, ttl: number): Promise<void> {
        const setItem = this.storage.setItem(
            key,
            JSON.stringify({
                expiration: new Date().getTime() + ttl,
                value,
            }),
        );
        if (isPromise(setItem)) {
            await setItem;
        }
        this.keys.push(key);
    }
}
