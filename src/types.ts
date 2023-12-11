import {
    AxiosAdapter,
    AxiosPromise,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';

export interface StorageLikeCache {
    getItem(key: string): string | null;
    removeItem(key: string): any;
    setItem(key: string, value: string): any;
}
export interface AsyncStorageLikeCache {
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<any>;
    setItem(key: string, value: string): Promise<any>;
}
export interface MapLikeCache {
    delete(key: string): any;
    get(key: string): string | null;
    set(key: string, value: string): void;
}
export interface AsyncMapLikeCache {
    delete(key: string): Promise<any>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<any>;
}
export interface CacheManagerLikeCache {
    del(key: string): any;
    get(key: string): string | null;
    set(key: string, value: string): void;
}
export interface AsyncCacheManagerLikeCache {
    del(key: string): Promise<any>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<any>;
}

export type AxiosCacheStorage =
    | StorageLikeCache
    | AsyncStorageLikeCache
    | MapLikeCache
    | AsyncMapLikeCache
    | CacheManagerLikeCache
    | AsyncCacheManagerLikeCache;

export interface CacheLogger {
    log(message: string): void;
}

export interface AxiosCacheOptions {
    debug?: boolean;
    defaultTTL?: number;
    logger?: CacheLogger;
    parseHeaders?: boolean;
    storage?: AxiosCacheStorage;
}

export interface AxiosCacheObject {
    expiration: number;
    value: AxiosResponse;
}

export interface AxiosCacheRequestConfig extends InternalAxiosRequestConfig {
    cache?: boolean | number;
}

export interface AxiosCacheAdapter extends AxiosAdapter {
    (config: AxiosCacheRequestConfig): AxiosPromise;
}
