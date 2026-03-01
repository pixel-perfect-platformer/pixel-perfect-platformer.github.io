import { auth } from './firebase-config.js';
import { signInWithPopup, GoogleAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';
import State from './state.js';

export class AuthService {
    static isSigningIn = false;

    static init() {
        onAuthStateChanged(auth, async (user) => {
            State.currentUser = user;
            if (user) {
                // User is logged in, show title screen
                State.showSignInScreen = false;
                State.showTitleScreen = true;
                State.isSignInForced = false;
                const { LevelManager } = await import('./level-manager.js');
                await LevelManager.loadLevelsFromStorage();
            } else {
                // User is not logged in, show sign-in screen
                State.showTitleScreen = false;
                State.showSignInScreen = true;
                State.isSignInForced = true;
            }
        });
    }

    static async signInWithGoogle() {
        if (this.isSigningIn) return;
        this.isSigningIn = true;
        
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            State.currentUser = result.user;
            State.showSignInScreen = false;
            State.showTitleScreen = true;
            const { LevelManager } = await import('./level-manager.js');
            await LevelManager.loadLevelsFromStorage();
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
            State.showSignInScreen = false;
            State.showTitleScreen = true;
            const { LevelManager } = await import('./level-manager.js');
            await LevelManager.loadLevelsFromStorage();
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
            State.showSignInScreen = false;
            State.showTitleScreen = true;
            const { LevelManager } = await import('./level-manager.js');
            await LevelManager.loadLevelsFromStorage();
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
            if (State.currentUser) {
                const { LevelManager } = await import('./level-manager.js');
                await LevelManager.saveLevelsToStorage();
            }
            await signOut(auth);
            State.currentUser = null;
            State.showTitleScreen = false;
            State.showSignInScreen = true;
            State.isSignInForced = true;
            State.showCustomizationScreen = false;
            State.showCreditsScreen = false;
            State.showLevelsScreen = false;
            State.editorMode = false;
            State.isRunning = false;
            const { LevelManager } = await import('./level-manager.js');
            await LevelManager.loadLevelsFromStorage();
        } catch (error) {
            console.error('Sign-out error:', error);
            alert('Sign-out failed: ' + error.message);
        }
    }

    static async changePassword(currentPassword, newPassword) {
        if (this.isSigningIn) return;
        this.isSigningIn = true;
        
        try {
            const user = auth.currentUser;
            if (!user) throw new Error('No user logged in');
            
            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);
            alert('Password changed successfully');
            return true;
        } catch (error) {
            console.error('Password change error:', error);
            alert('Password change failed: ' + error.message);
            return false;
        } finally {
            this.isSigningIn = false;
        }
    }
}
