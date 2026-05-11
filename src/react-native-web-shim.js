import * as ReactNativeWeb from 'react-native-web';

// Mock native-only things
export const codegenNativeComponent = (name) => name;
export const codegenNativeCommands = (options) => ({});
export const codegenNativeQuery = (options) => ({});
export const requireNativeComponent = (name) => name;
export const NativeModules = {
    ...(ReactNativeWeb.NativeModules || {}),
    ReanimatedModule: {
        configureProps: () => { },
        createNode: () => { },
        connectNodes: () => { },
        disconnectNodes: () => { },
        getValue: () => { },
    },
};
export const TurboModuleRegistry = {
    get: (name) => null,
    getEnforcing: (name) => null,
};
export const TurboModule = {};
export const ViewPropTypes = {};
export const Mixin = {
    touchableHandleStartShouldSetResponder: () => { },
    touchableHandleResponderTerminationRequest: () => { },
    touchableHandleResponderGrant: () => { },
    touchableHandleResponderMove: () => { },
    touchableHandleResponderRelease: () => { },
    touchableHandleResponderTerminate: () => { },
};
export const Touchable = {
    Mixin,
};
export const DrawerLayoutAndroid = ReactNativeWeb.View;
export const customDirectEventTypes = {};
export const PressabilityDebugView = ReactNativeWeb.View;
export const NativeComponentRegistry = {
    get: (name) => name,
    set: (name, callback) => { },
};
export const LogBox = {
    ignoreLogs: () => { },
    ignoreAllLogs: () => { },
    install: () => { },
    uninstall: () => { },
};

// Reanimated/Worklets internals
export const _WORKLET = false;
export const _IS_FABRIC = false;
export const _REANIMATED_VERSION_WEB = '4.1.1';

const _global = typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {}));

if (_global) {
    _global._IS_FABRIC = _global._IS_FABRIC || false;
    _global._REANIMATED_IS_REDUCED_MOTION = _global._REANIMATED_IS_REDUCED_MOTION || false;
    _global.ReanimatedDataMock = _global.ReanimatedDataMock || {
        now: () => Date.now(),
    };
    _global._setGlobalConsole = _global._setGlobalConsole || (() => { });

    if (!_global.ReduceMotion) {
        _global.ReduceMotion = {
            System: 'system',
            Always: 'always',
            Never: 'never',
        };
    }

    // Reanimated properties commonly accessed
    if (_global._WORKLET === undefined) _global._WORKLET = false;
    if (!_global._S) {
        _global._S = {
            now: () => Date.now(),
        };
    }

    // Fabric/New Architecture mocks
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
}

// Export explicit common components/modules to ensure they are found
export const StyleSheet = ReactNativeWeb.StyleSheet;
export const View = ReactNativeWeb.View;
export const Text = ReactNativeWeb.Text;
export const Platform = ReactNativeWeb.Platform;
export const TouchableOpacity = ReactNativeWeb.TouchableOpacity;
export const ScrollView = ReactNativeWeb.ScrollView;
export const Image = ReactNativeWeb.Image;
export const SafeAreaView = ReactNativeWeb.SafeAreaView;
export const StatusBar = ReactNativeWeb.StatusBar;
export const Alert = ReactNativeWeb.Alert;
export const Dimensions = ReactNativeWeb.Dimensions;
export const Pressable = ReactNativeWeb.Pressable;
export const ActivityIndicator = ReactNativeWeb.ActivityIndicator;
export const FlatList = ReactNativeWeb.FlatList;
export const TextInput = ReactNativeWeb.TextInput;
export const KeyboardAvoidingView = ReactNativeWeb.KeyboardAvoidingView;
export const TouchableWithoutFeedback = ReactNativeWeb.TouchableWithoutFeedback;
export const Keyboard = ReactNativeWeb.Keyboard;
export const ImageBackground = ReactNativeWeb.ImageBackground;
export const Animated = ReactNativeWeb.Animated;
export const PanResponder = ReactNativeWeb.PanResponder;

export const UIManager = ReactNativeWeb.UIManager || {
    getViewManagerConfig: (name) => ({}),
    getConstants: () => ({}),
    measure: () => { },
    dispatchViewManagerCommand: () => { },
};

export const DeviceEventEmitter = ReactNativeWeb.DeviceEventEmitter || {
    addListener: () => ({ remove: () => { } }),
    emit: () => { },
    removeAllListeners: () => { },
};
export const InteractionManager = {
    runAfterInteractions: (callback) => {
        if (typeof callback === 'function') callback();
        return { cancel: () => { } };
    },
    createInteractionHandle: () => 1,
    clearInteractionHandle: () => { },
    setDeadline: () => { },
};
export const EventEmitter = class {
    addListener() { return { remove: () => { } }; }
    removeAllListeners() { }
    emit() { }
};

// Mock assets-registry
export const registerAsset = (asset) => asset;
export const getAssetByID = (id) => ({});

export const NativeEventEmitter = class {
    addListener() { return { remove: () => { } }; }
    removeAllListeners() { }
    emit() { }
};

export const Linking = {
    addEventListener: () => ({ remove: () => { } }),
    removeEventListener: () => { },
    openURL: () => Promise.resolve(),
    canOpenURL: () => Promise.resolve(true),
    getInitialURL: () => Promise.resolve(null),
};
export const Settings = {
    get: () => null,
    set: () => { },
    watchKeys: () => 0,
    clearWatch: () => { },
};

// All explicit mocks
const mocks = {
    codegenNativeComponent,
    codegenNativeCommands,
    codegenNativeQuery,
    requireNativeComponent,
    NativeModules,
    TurboModuleRegistry,
    TurboModule,
    ViewPropTypes,
    Mixin,
    Touchable,
    LogBox,
    DrawerLayoutAndroid,
    customDirectEventTypes,
    PressabilityDebugView,
    NativeComponentRegistry,
    UIManager,
    InteractionManager,
    DeviceEventEmitter,
    NativeEventEmitter,
    EventEmitter,
    Linking,
    Settings,
    registerAsset,
    getAssetByID,
    _WORKLET,
    _IS_FABRIC,
    _REANIMATED_VERSION_WEB,
};

// Export everything from react-native-web
export * from 'react-native-web';

// Final assembly of default export
const allMocks = {
    ...ReactNativeWeb,
    ...mocks,
};

// If react-native-web has its own default, merge it too
if (ReactNativeWeb.default) {
    Object.assign(allMocks, ReactNativeWeb.default);
}

function defaultExport(...args) {
    return defaultExport;
}

// Manually assign all properties to the function to ensure it is both a function and a namespace
Object.keys(allMocks).forEach(key => {
    try {
        defaultExport[key] = allMocks[key];
    } catch (e) {
        // Some properties might be read-only on function prototype
    }
});

export default defaultExport;
