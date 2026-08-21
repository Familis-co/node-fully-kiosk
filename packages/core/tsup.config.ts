import { defineConfig } from 'tsup';

/**
 * Two builds, because the React entry point needs a "use client" banner that
 * Rollup's tree-shake pass would strip, and must not bundle React itself.
 */
export default defineConfig([
  {
    entry: {
      index: 'src/index.ts',
      js: 'src/js-interface/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: true,
    treeshake: true,
    splitting: false,
    target: 'es2022',
    outDir: 'dist',
  },
  {
    entry: { react: 'src/react/index.ts' },
    format: ['esm', 'cjs'],
    dts: true,
    sourcemap: true,
    clean: false,
    // Rollup's tree-shake pass drops module level directives, which would strip
    // the banner below. Consumers tree-shake through the ESM output and
    // `sideEffects: false` anyway.
    treeshake: false,
    splitting: false,
    target: 'es2022',
    outDir: 'dist',
    external: ['react', 'react-dom'],
    banner: { js: "'use client';" },
  },
]);
