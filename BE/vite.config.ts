import { defineConfig } from 'vite';
import { VitePluginNode } from 'vite-plugin-node';

export default defineConfig({
  server: {
    port: 5000,
  },
  plugins: [
    ...VitePluginNode({
      adapter: 'express',
      appPath: './src/server.ts',
      exportName: 'app',
      tsCompiler: 'esbuild',
    }),
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    lib: {
      entry: 'src/server.ts',
      formats: ['es'],
      fileName: 'server',
    },
    rollupOptions: {
      external: [
        'express',
        'sequelize',
        'mysql2',
        'dotenv',
        'cors',
        'bcryptjs',
        'jsonwebtoken',
        'express-validator',
        'morgan',
        'helmet',
        'compression',
        'multer',
      ],
    },
  },
  optimizeDeps: {
    exclude: ['sequelize'],
  },
});

