import { ONE_SECOND_IN_MS } from '../src/constants';
import { getCacheTTL, parseCacheControlHeader } from '../src/ttl';

describe('parseCacheControlHeader tests', () => {
    it.each(['max-age', 's-maxage'])(
        'returns numerical values for %s header when provided',
        (instruction) => {
            const value = parseCacheControlHeader({
                headers: {
                    'cache-control': `public, ${instruction}=100`,
                },
            } as any);
            expect(value).toBe(100 * ONE_SECOND_IN_MS);
        },
    );
    it.each(['a100', '', 'one', 0])(
        'returns null value for wrong or zero value',
        (falseValue) => {
            const value = parseCacheControlHeader({
                headers: {
                    'cache-control': `public, max-age=${falseValue}`,
                },
            } as any);
            expect(value).toBeNull();
        },
    );
    it('overrides max-age with s-maxage when both are provided', () => {
        const value = parseCacheControlHeader({
            headers: {
                'cache-control': `public, max-age=1, s-maxage=2`,
            },
        } as any);
        expect(value).toBe(2 * ONE_SECOND_IN_MS);
    });
    it.each(['cache-control', 'CACHE-CONTROL', 'Cache-Control'])(
        'is agnostic of header casing - %s',
        (header) => {
            const value = parseCacheControlHeader({
                headers: {
                    [header]: `public, max-age=100`,
                },
            } as any);
            expect(value).toBe(100 * ONE_SECOND_IN_MS);
        },
    );
    it('return null when no cache-control header is provided', () => {
        const value = parseCacheControlHeader({
            headers: {
                Authorization: 'max-age=100',
            },
        } as any);
        expect(value).toBeNull();
    });
});

describe('getCacheTTL tests', () => {
    it.each([
        [false, ONE_SECOND_IN_MS, true, null],
        [true, undefined, true, ONE_SECOND_IN_MS],
        [true, undefined, false, null],
        [true, ONE_SECOND_IN_MS, true, ONE_SECOND_IN_MS],
        [ONE_SECOND_IN_MS, undefined, true, ONE_SECOND_IN_MS],
        [undefined, undefined, true, ONE_SECOND_IN_MS],
        [undefined, undefined, false, null],
    ])(
        'for AXIOS_CACHE = %s, defaultTTL = %s, returns %s',
        (symbolValue, defaultTTL, parseHeaders, returnVal) => {
            const value = getCacheTTL({
                parseHeaders,
                defaultTTL,
                config: { cache: symbolValue },
                response: {
                    headers: { 'cache-control': 'max-age=1' },
                } as any,
            });
            expect(value).toBe(returnVal);
        },
    );
});
