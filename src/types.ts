import { AxiosResponse } from 'axios';

export interface AxiosCacheStorage {
    getItem(key: string): string | null;
    removeItem(key: string): void;
    setItem(key: string, value: string): void;
}

export interface AsyncAxiosCacheStorage {
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
    setItem(key: string, value: string): Promise<any>;
}

export interface CacheLogger {
    log(message: string): void;
}

export interface AxiosCacheOptions {
    debug?: boolean;
    storage?: AxiosCacheStorage | AsyncAxiosCacheStorage;
    logger?: CacheLogger;
    defaultTTL?: number;
    parseHeaders?: boolean;
}

export interface AxiosCacheObject {
    expiration: number;
    value: AxiosResponse;
}
