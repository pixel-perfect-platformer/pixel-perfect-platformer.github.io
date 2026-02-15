import { auth } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';
import State from './state.js';

export class AuthService {
    static isSigningIn = false;

    static init() {
        onAuthStateChanged(auth, (user) => {
            State.currentUser = user;
        });
    }

    static async signInWithGoogle() {
        if (this.isSigningIn) return;
        this.isSigningIn = true;
        
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            State.currentUser = result.user;
            return result.user;
        } catch (error) {
            if (error.code !== 'auth/cancelled-popup-request') {
                console.error('Google sign-in error:', error);
                alert('Sign-in failed: ' + error.message);
            }
        } finally {
            this.isSigningIn = false;
        }
    }

    static async signInWithEmail(email, password) {
        if (this.isSigningIn) return;
        this.isSigningIn = true;
        
        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            State.currentUser = result.user;
            return result.user;
        } catch (error) {
            console.error('Email sign-in error:', error);
            alert('Sign-in failed: ' + error.message);
        } finally {
            this.isSigningIn = false;
        }
    }

    static async signUpWithEmail(email, password) {
        if (this.isSigningIn) return;
        this.isSigningIn = true;
        
        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            State.currentUser = result.user;
            return result.user;
        } catch (error) {
            console.error('Sign-up error:', error);
            alert('Sign-up failed: ' + error.message);
        } finally {
            this.isSigningIn = false;
        }
    }

    static async signOut() {
        if (this.isSigningIn) return;
        
        try {
            await signOut(auth);
            State.currentUser = null;
        } catch (error) {
            console.error('Sign-out error:', error);
            alert('Sign-out failed: ' + error.message);
        }
    }
}
