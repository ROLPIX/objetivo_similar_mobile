import { initializeApp, getApp, getApps } from 'firebase/app';
import { Platform } from 'react-native';
import {
    getFirestore,
    getDocFromServer,
    doc,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    deleteField,
    orderBy,
    limit,
    connectFirestoreEmulator
} from 'firebase/firestore';
import {
    getAuth,
    initializeAuth,
    browserPopupRedirectResolver,
    signInWithPopup as firebaseSignInWithPopup,
    GoogleAuthProvider,
    onAuthStateChanged,
    signOut,
    User as FirebaseUser
} from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase App only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

// Initialize Auth - simplest possible Web initialization
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();

/**
 * Custom wrapper for signInWithPopup to handle its availability on different environments.
 */
const signInWithPopup = async (authInstance: any, provider: any) => {
    try {
        const { signInWithPopup: firebaseSignIn } = await import('firebase/auth');
        return await firebaseSignIn(authInstance, provider);
    } catch (error: any) {
        console.error('signInWithPopup failed, attempting fallback:', error.code, error.message);

        // Fallback to Redirect for web environments where Popups are blocked
        try {
            const { signInWithRedirect } = await import('firebase/auth');
            console.log('Falling back to signInWithRedirect...');
            return await signInWithRedirect(authInstance, provider);
        } catch (redirectError) {
            console.error('Redirect fallback failed:', redirectError);
        }

        throw new Error('O login social falhou. Por favor, use a matrícula e PIN.');
    }
};

// Export Firestore functions
export {
    doc,
    collection,
    query,
    where,
    getDocs,
    getDoc,
    setDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    Timestamp,
    serverTimestamp,
    deleteField,
    orderBy,
    limit
};

// Export Auth functions
export {
    signOut,
    onAuthStateChanged,
    signInWithPopup
};
export type { FirebaseUser };

export enum OperationType {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LIST = 'list',
    GET = 'get',
    WRITE = 'write',
}

interface FirestoreErrorInfo {
    error: string;
    operationType: OperationType;
    path: string | null;
    authInfo: {
        userId?: string | null;
        email?: string | null;
        emailVerified?: boolean | null;
        isAnonymous?: boolean | null;
        tenantId?: string | null;
        providerInfo?: {
            providerId?: string | null;
            email?: string | null;
        }[];
    }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
        error: error instanceof Error ? error.message : String(error),
        authInfo: {
            userId: auth.currentUser?.uid,
            email: auth.currentUser?.email,
            emailVerified: auth.currentUser?.emailVerified,
            isAnonymous: auth.currentUser?.isAnonymous,
            tenantId: auth.currentUser?.tenantId,
            providerInfo: auth.currentUser?.providerData?.map(provider => ({
                providerId: provider.providerId,
                email: provider.email,
            })) || []
        },
        operationType,
        path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
}

async function testConnection() {
    try {
        await getDocFromServer(doc(db, 'test', 'connection'));
    } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
            console.error("Please check your Firebase configuration.");
        }
    }
}
testConnection();
