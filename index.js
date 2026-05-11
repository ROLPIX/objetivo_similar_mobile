// Initialize globals before any imports
const _global = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {}));

_global.global = _global;
_global._IS_FABRIC = _global._IS_FABRIC || false;
_global._WORKLET = _global._WORKLET || false;
_global._REANIMATED_VERSION_WEB = _global._REANIMATED_VERSION_WEB || '4.1.1';

if (!_global.ReduceMotion) {
    _global.ReduceMotion = {
        System: 'system',
        Always: 'always',
        Never: 'never',
    };
}

if (!_global._S) {
    _global._S = { now: () => Date.now() };
}

if (!_global.nativeFabricUIManager) {
    _global.nativeFabricUIManager = {
        createNode: () => { },
        cloneNodeWithNewChildren: () => { },
        appendChild: () => { },
        createChildSet: () => { },
        appendChildToContextContainer: () => { },
        cloneNode: () => { },
        setNativeProps: () => { },
        measure: () => [0, 0, 0, 0, 0, 0],
        dispatchCommand: () => { },
        getConstants: () => ({}),
    };
}

if (!_global.NativeModules) {
    _global.NativeModules = {
        ReanimatedModule: {
            configureProps: () => { },
            createNode: () => { },
            connectNodes: () => { },
            disconnectNodes: () => { },
            getValue: () => { },
        },
    };
} else if (!_global.NativeModules.ReanimatedModule) {
    _global.NativeModules.ReanimatedModule = {
        configureProps: () => { },
        createNode: () => { },
        connectNodes: () => { },
        disconnectNodes: () => { },
        getValue: () => { },
    };
}

import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { Buffer } from 'buffer';

if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
}

try {
    console.log('index.js stage: Importing App...');
    // Log global state to see if something is missing
    console.log('Environment constants:', {
        Platform: typeof Platform !== 'undefined' ? Platform.OS : 'unknown',
        globalS: typeof global !== 'undefined' ? !!global._S : 'no global',
    });

    const AppImport = require('./src/App');
    const App = AppImport.default || AppImport;

    console.log('index.js stage: Registering component...');
    registerRootComponent(App);
    console.log('index.js stage: App registered successfully.');
} catch (error) {
    console.error('CRITICAL STARTUP ERROR:', error.message);
    console.error('Stack trace:', error.stack);
}
