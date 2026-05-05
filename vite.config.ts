import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-native': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native-maps': path.resolve(__dirname, 'src/react-native-maps-web.tsx'),
        '@react-native/assets-registry/registry': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        '@react-native/assets-registry': path.resolve(__dirname, 'src/react-native-web-shim.js'),
      },
      extensions: [
        '.web.mjs',
        '.web.js',
        '.web.mts',
        '.web.ts',
        '.web.jsx',
        '.web.tsx',
        '.mjs',
        '.js',
        '.mts',
        '.ts',
        '.jsx',
        '.tsx',
        '.json',
      ],
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
