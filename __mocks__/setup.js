process.env.EXPO_OS = 'web';

jest.mock('react-native-gesture-handler', () => {
    const { View } = require('react-native');
    return {
        Swipeable: View,
        DrawerLayout: View,
        State: {},
        ScrollView: View,
        Slider: View,
        Switch: View,
        TextInput: View,
        ToolbarAndroid: View,
        ViewPagerAndroid: View,
        DrawerLayoutAndroid: View,
        WebView: View,
        NativeViewGestureHandler: View,
        TapGestureHandler: View,
        FlingGestureHandler: View,
        ForceTouchGestureHandler: View,
        LongPressGestureHandler: View,
        PanGestureHandler: View,
        PinchGestureHandler: View,
        RotationGestureHandler: View,
        /* Buttons */
        RawButton: View,
        BaseButton: View,
        RectButton: View,
        BorderlessButton: View,
        /* Other */
        FlatList: View,
        gestureHandlerRootHOC: jest.fn(),
        Directions: {},
        GestureHandlerRootView: View,
    };
});

global.fetch = jest.fn(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
    })
);

jest.useFakeTimers();

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
    getItem: jest.fn(() => Promise.resolve(null)),
    removeItem: jest.fn(() => Promise.resolve()),
    clear: jest.fn(() => Promise.resolve()),
    getAllKeys: jest.fn(() => Promise.resolve([])),
    multiGet: jest.fn(() => Promise.resolve([])),
    multiSet: jest.fn(() => Promise.resolve()),
    multiMerge: jest.fn(() => Promise.resolve()),
    multiRemove: jest.fn(() => Promise.resolve()),
}));

jest.mock('firebase/app', () => {
    return {
        initializeApp: jest.fn(() => ({})),
        getApp: jest.fn(() => ({})),
        getApps: jest.fn(() => []),
    };
});

jest.mock('firebase/auth', () => {
    return {
        getAuth: jest.fn(() => ({
            currentUser: null,
            onAuthStateChanged: jest.fn((cb) => cb(null)),
            signInWithEmailAndPassword: jest.fn(),
            createUserWithEmailAndPassword: jest.fn(),
            signOut: jest.fn(),
        })),
        onAuthStateChanged: jest.fn((auth, cb) => { cb(null); return jest.fn(); }),
        initializeAuth: jest.fn(),
        getReactNativePersistence: jest.fn(),
        GoogleAuthProvider: class { },
        signInWithPopup: jest.fn(),
        signInWithRedirect: jest.fn(),
        getRedirectResult: jest.fn(),
    };
});

jest.mock('firebase/firestore', () => {
    return {
        getFirestore: jest.fn(() => ({})),
        collection: jest.fn(),
        doc: jest.fn(),
        getDocs: jest.fn(() => Promise.resolve({ empty: true, docs: [] })),
        getDoc: jest.fn(() => Promise.resolve({ exists: () => false, data: () => ({}) })),
        setDoc: jest.fn(),
        addDoc: jest.fn(),
        updateDoc: jest.fn(),
        deleteDoc: jest.fn(),
        query: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        onSnapshot: jest.fn((ref, cb) => {
            // Avoid calling cb right away if it causes issues, but we can do a dummy cb
            return jest.fn();
        }),
        writeBatch: jest.fn(() => ({
            set: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            commit: jest.fn(() => Promise.resolve()),
        })),
        serverTimestamp: jest.fn(),
    };
});

jest.mock('firebase/performance', () => {
    return {
        getPerformance: jest.fn(),
    };
});
