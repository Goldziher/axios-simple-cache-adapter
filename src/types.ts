import {
    AxiosAdapter,
    AxiosPromise,
    AxiosResponse,
    InternalAxiosRequestConfig,
} from 'axios';

export interface StorageLikeCache {
    getItem(key: string): string | null;
    setItem(key: string, value: string): any;
    removeItem(key: string): any;
}
export interface AsyncStorageLikeCache {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<any>;
    removeItem(key: string): Promise<any>;
}
export interface MapLikeCache {
    get(key: string): string | null;
    set(key: string, value: string): void;
    delete(key: string): any;
}
export interface AsyncMapLikeCache {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<any>;
    delete(key: string): Promise<any>;
}
export interface CacheManagerLikeCache {
    get(key: string): string | null;
    set(key: string, value: string): void;
    del(key: string): any;
}
export interface AsyncCacheManagerLikeCache {
    get(key: string): Promise<string | null>;
    set(key: string, value: string): Promise<any>;
    del(key: string): Promise<any>;
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
    storage?: AxiosCacheStorage;
    logger?: CacheLogger;
    defaultTTL?: number;
    parseHeaders?: boolean;
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
