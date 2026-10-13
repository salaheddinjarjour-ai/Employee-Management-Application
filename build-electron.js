const esbuild = require('esbuild')
const path = require('path')

// Build main process
esbuild.build({
    entryPoints: ['electron/main.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist-electron/main.js',
    external: ['electron', 'sql.js', 'bcrypt'],
    sourcemap: true,
    format: 'cjs',
    resolveExtensions: ['.ts', '.js', '.json']
}).then(() => console.log('✓ Built main.js')).catch(() => process.exit(1))

// Build preload script
esbuild.build({
    entryPoints: ['electron/preload.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outfile: 'dist-electron/preload.js',
    external: ['electron'],
    sourcemap: true,
    format: 'cjs',
    resolveExtensions: ['.ts', '.js', '.json']
}).then(() => console.log('✓ Built preload.js')).catch(() => process.exit(1))
