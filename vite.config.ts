import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react({
        babel: {
          plugins: ['react-native-reanimated/plugin'],
        },
      }),
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      '_IS_FABRIC': 'false',
      '__DEV__': mode === 'development' ? 'true' : 'false',
      'global': 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'react-native$': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Renderer/shims/ReactNative': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Renderer/shims/ReactFabric': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/ReactNative/ReactFabricPublicInstance/ReactFabricPublicInstance': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Pressability/PressabilityDebug': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Renderer/shims/ReactNativeViewConfigRegistry': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Utilities/codegenNativeQuery': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Image/AssetRegistry': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Utilities/NativeComponentRegistry': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/TurboModule/TurboModuleRegistry': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Components/Touchable/Touchable': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Components/Touchable/TouchableOpacity': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native/Libraries/Components/Touchable/TouchableHighlight': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native-web/Libraries/Utilities/codegenNativeComponent': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native-web/Libraries/Utilities/codegenNativeCommands': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native-web/Libraries/Renderer/shims/ReactNative': path.resolve(__dirname, 'src/react-native-web-shim.js'),
        'react-native-web/Libraries/Renderer/shims/ReactFabric': path.resolve(__dirname, 'src/react-native-web-shim.js'),
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
