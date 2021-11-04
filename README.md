[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Goldziher_axios-cache&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Goldziher_axios-cache)
[![Duplicated Lines (%)](https://sonarcloud.io/api/project_badges/measure?project=Goldziher_axios-cache&metric=duplicated_lines_density)](https://sonarcloud.io/summary/new_code?id=Goldziher_axios-cache)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=Goldziher_axios-cache&metric=bugs)](https://sonarcloud.io/summary/new_code?id=Goldziher_axios-cache)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=Goldziher_axios-cache&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=Goldziher_axios-cache)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=Goldziher_axios-cache&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=Goldziher_axios-cache)
[![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=Goldziher_axios-cache&metric=reliability_rating)](https://sonarcloud.io/summary/new_code?id=Goldziher_axios-cache)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=Goldziher_axios-cache&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=Goldziher_axios-cache)

# Axios Simple Cache Adapter

Configurable cache adapter for Axios, working in both Browser and Node.

Features:

-   ✅ Supports both sync and async storage
-   ✅ Supports user defined storage
-   ✅ Supports cache-control headers
-   ✅ Supports per endpoint caching configuration
-   ✅ Supports defaults

Why this library?

-   💯 Written in typescript
-   💯 Rigorously tested
-   💯 Simple to use

## Usage

The simplest way to use this library is to create an adapter and pass it to axios:

```typescript
import axios from 'axios';
import { AxiosCacheRequestConfig, createCacheAdapter } from 'axios-cache';

const adapter = createCacheAdapter();

// use the adapter as part of the axios request config
async function makeAPICall(): Promise<SomeInterface> {
    const response = await axios.get<SomeInterface>('some/url', {
        adapter,
        cache: 1000, // value in MS
    } as AxiosCacheRequestConfig);
    return response.data;
}

// or pass it as part of the defaults passed to axios.create:

const instance = axios.create({ baseURL: 'https://myapi.com', adapter });
```

The `createCacheAdapter` function accepts an options object with the following signature:

```typescript
interface AxiosCacheOptions {
    debug?: boolean;
    defaultTTL?: number;
    logger?: CacheLogger;
    parseHeaders?: boolean;
    storage?: AxiosCacheStorage | AsyncAxiosCacheStorage;
}
```

-   `debug`: log debug message, defaults to **false**
-   `defaultTTL`: default TTL to use when enabling caching for a particular endpoint, defaults to **undefined**
-   `logger`: logger to use when debug=true, defaults to **console**
-   `parseHeaders`: parse cache-control headers on the response, defaults to **true**
-   `storage`: storage to use, defaults to **localStorage** in the browser and a simple memory based caching in node.

### The cache request-config param

This library extends the `AxiosRequestConfig` with an additional key called `cache`:

```typescript
interface AxiosCacheRequestConfig extends AxiosRequestConfig {
    cache?: boolean | number;
}
```

You can use it on a per endpoint basis. If the value is a number, this endpoint will be cached for the particular TTL
specified:

```typescript
async function makeAPICall(): Promise<SomeInterface> {
    const response = await axios.get<SomeInterface>('some/url', {
        adapter,
        cache: 1000, // value in MS
    } as AxiosCacheRequestConfig);
    return response.data;
}
```

If it is `true` then caching will occur with the `defaultTTL` parameter passed to `createCacheAdapter`. If no value is
passed, caching will not occur:

```typescript
const adapterWithDefaultTTL = createCacheAdapter({
    defaultTTL: 1000, // one second
});

// here caching will occur
async function makeAPICall(): Promise<SomeInterface> {
    const response = await axios.get<SomeInterface>('some/url', {
        adapter: adapterWithDefaultTTL,
        cache: true,
    } as AxiosCacheRequestConfig);
    return response.data;
}

const adapterWithoutDefaultTTL = createCacheAdapter();

// here caching will not occur
async function makeAPICall(): Promise<SomeInterface> {
    const response = await axios.get<SomeInterface>('some/url', {
        adapter: adapterWithoutDefaultTTL,
        cache: true,
    } as AxiosCacheRequestConfig);
    return response.data;
}
```

If though the value of `cache` is `false`, no caching will occur for that particular endpoint, regardless of defaultTTL
and any cache-control headers:

```typescript
const adapterWithDefaultTTL = createCacheAdapter({
    defaultTTL: 1000, // one second
});

// no caching will occur here, even if cache-control headers are present
async function makeAPICall(): Promise<SomeInterface> {
    const response = await axios.get<SomeInterface>('some/url', {
        adapter: adapterWithDefaultTTL,
        cache: false,
    } as AxiosCacheRequestConfig);
    return response.data;
}
```

### Cache-Control headers

When to use this feature?

[cache-control headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) are commonly used in
APIs to ensure a browser and/or network intermediaries, cache a response. As such, in a browser environment, the browser
should usually take care of caching - not the code. The main reason to use cache-control header based caching in the
browser, is for using the same cache across multiple tabs - this is possible when using localStorage or a library such
as `localForage`. But if you intend to use `sessionStorage`, this will be redundant.

In a nodeJS environment on the other hand, there is no browser involved and cache-control headers should be dealt with
more explicitly. Here its a good idea to use these headers as a source of truth for cache TTL. Furthermore, if you use a
storage backend that is shared across multiple instances of your server, e.g. a redis cache, you will be able to share
cached responses.

#### Note regarding overriding cache TTL

If you pass an explicit cache value as part of the request config, this value will override whatever cache-control
headers are in place:

```typescript
const instance = axios.create({ baseURL: 'https://myapi.com', adapter });

const response = await instance.get('endpoint-with-cache-control', {
    cache: 10000,
});

// response.headers["cache-control"] === "public, max-age=15" (15 seconds)
// caching here will be 10000, i.e. 10 seconds
```

### Storage

This library is agnostic regarding the storage used. You are free to pass any storage - sync or async - to
the `createCacheAdapter` function. You must though make sure that the storage object you are passing fulfills one of the
following interfaces:

```typescript
interface StorageLikeCache {
    getItem(key: string): string | null;

    setItem(key: string, value: string): any;

    removeItem(key: string): any;
}

interface AsyncStorageLikeCache {
    getItem(key: string): Promise<string | null>;

    setItem(key: string, value: string): Promise<any>;

    removeItem(key: string): Promise<any>;
}

interface MapLikeCache {
    get(key: string): string | null;

    set(key: string, value: string): void;

    delete(key: string): any;
}

interface AsyncMapLikeCache {
    get(key: string): Promise<string | null>;

    set(key: string, value: string): Promise<any>;

    delete(key: string): Promise<any>;
}

interface CacheManagerLikeCache {
    get(key: string): string | null;

    set(key: string, value: string): void;

    del(key: string): any;
}

interface AsyncCacheManagerLikeCache {
    get(key: string): Promise<string | null>;

    set(key: string, value: string): Promise<any>;

    del(key: string): Promise<any>;
}

type AxiosCacheStorage =
    | StorageLikeCache
    | AsyncStorageLikeCache
    | MapLikeCache
    | AsyncMapLikeCache
    | CacheManagerLikeCache
    | AsyncCacheManagerLikeCache;
```

Thus, you can easily pass `sessionStorage`, a library storage such as [
localForage](https://www.npmjs.com/package/localforage), a node caching library
like [node-cache-manager](https://www.npmjs.com/package/cache-manager), or even just a simple `new Map<string,string>()`
.

## Contributing

This library is open source. As such contributions of any kind welcome! Please see
the [contributing guide](CONTRIBUTING.md).
