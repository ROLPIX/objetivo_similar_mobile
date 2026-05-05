import * as ReactNativeWeb from 'react-native-web';

// Mock native-only things
export const codegenNativeComponent = (name) => name;
export const codegenNativeCommands = (options) => ({});
export const requireNativeComponent = (name) => name;
export const NativeModules = ReactNativeWeb.NativeModules || {};
export const ViewPropTypes = {};
export const Touchable = {};

// Mock assets-registry
export const registerAsset = (asset) => asset;
export const getAssetByID = (id) => ({});

// Export everything from react-native-web
export * from 'react-native-web';

// For any other missing named exports, we can re-export the whole namespace as default
export default ReactNativeWeb;
