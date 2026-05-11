import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Global shims for libraries that expect a native environment or Reanimated internals
const _global = (typeof globalThis !== 'undefined' ? globalThis : (typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : {}))) as any;
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
if (!_global._S) _global._S = { now: () => Date.now() };

import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
