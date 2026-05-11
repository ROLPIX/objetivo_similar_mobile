module.exports = {
    preset: "jest-expo",
    setupFiles: [
        "<rootDir>/__mocks__/setup.js"
    ],
    transform: {
        "^.+\\.(js|jsx|ts|tsx|mjs|cjs)$": "babel-jest"
    },
    transformIgnorePatterns: [
        "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|expo-.*|lucide-react-native|moti|@motify|firebase|@firebase)"
    ]
};
