import { OutputOptions } from 'rollup';
import { terser } from 'rollup-plugin-terser';
import manifest from './package.json';
import typescript from '@rollup/plugin-typescript';

const { module, main } = manifest as { module: string; main: string };

const output: OutputOptions[] = [
    {
        exports: 'named',
        sourcemap: true,
        file: module,
        format: 'es',
    },
    {
        exports: 'named',
        sourcemap: true,
        file: main,
        format: 'cjs',
    },
];

export default {
    input: 'src/index.ts',
    output,
    external: ['axios'],
    plugins: [
        typescript({
            tsconfig: './tsconfig.build.json',
        }),
        terser(),
    ],
};
