import { db, auth } from './firebase-config.js';
import { collection, doc, setDoc, getDoc, getDocs, deleteDoc } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';
import { GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';

export class FirebaseService {
  
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  }

  async signInWithEmail(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  }

  async signUpWithEmail(email, password) {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  }

  async signInWithPhone(phoneNumber, recaptchaVerifier) {
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error('Error signing in with phone:', error);
      throw error;
    }
  }

  setupRecaptcha(elementId) {
    return new RecaptchaVerifier(elementId, {
      'size': 'invisible',
      'callback': (response) => {
        console.log('reCAPTCHA solved');
      }
    }, auth);
  }

  async signOut() {
    try {
      await signOut(auth);
      return true;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async saveUserLevels(userId, levels) {
    try {
      if (!auth.currentUser) {
        console.warn('User not authenticated, skipping save');
        return false;
      }
      await setDoc(doc(db, 'user_levels', userId), {
        levels: levels,
        updatedAt: new Date(),
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error('Error saving user levels:', error);
      return false;
    }
  }

  async loadUserLevels(userId) {
    try {
      const docRef = doc(db, 'user_levels', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error loading user levels:', error);
      return null;
    }
  }

  async saveUserProgress(userId, progress) {
    try {
      await setDoc(doc(db, 'user_progress', userId), {
        ...progress,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error saving user progress:', error);
      return false;
    }
  }

  async loadUserProgress(userId) {
    try {
      const docRef = doc(db, 'user_progress', userId);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error loading user progress:', error);
      return null;
    }
  }
  
  async saveLevelToCloud(levelIndex, levelData) {
    try {
      if (!auth.currentUser) {
        return false;
      }
      const category = levelData.category || 'community';
      if (category === 'official') {
        await setDoc(doc(db, 'official_levels', `level_${levelIndex}`), {
          ...levelData,
          updatedAt: new Date(),
          userId: auth.currentUser.uid
        });
      } else {
        await setDoc(doc(db, `users/${auth.currentUser.uid}/community_levels`, `level_${levelIndex}`), {
          ...levelData,
          updatedAt: new Date()
        });
      }
      return true;
    } catch (error) {
      console.error('Error saving level:', error);
      return false;
    }
  }

  async loadLevelFromCloud(levelIndex) {
    try {
      const docRef = doc(db, 'levels', `level_${levelIndex}`);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error loading level:', error);
      return null;
    }
  }

  async getAllLevels() {
    try {
      if (!auth.currentUser) {
        return [];
      }
      const levels = [];
      try {
        const officialSnapshot = await getDocs(collection(db, 'official_levels'));
        officialSnapshot.forEach((doc) => {
          levels.push({ id: doc.id, ...doc.data(), category: 'official' });
        });
      } catch (e) {
        console.log('No official levels collection yet');
      }
      
      try {
        const communitySnapshot = await getDocs(collection(db, `users/${auth.currentUser.uid}/community_levels`));
        communitySnapshot.forEach((doc) => {
          levels.push({ id: doc.id, ...doc.data(), category: 'community' });
        });
      } catch (e) {
        console.log('No community levels for this user yet');
      }
      
      try {
        const publishedSnapshot = await getDocs(collection(db, 'published_levels'));
        publishedSnapshot.forEach((doc) => {
          const publishedLevel = { id: doc.id, ...doc.data(), category: 'community' };
          // Only add if not already in levels (avoid duplicates)
          const exists = levels.some(level => 
            level.name === publishedLevel.name && 
            level.authorId === publishedLevel.authorId
          );
          if (!exists) {
            levels.push(publishedLevel);
          }
        });
      } catch (e) {
        console.log('No published levels yet');
      }
      
      return levels;
    } catch (error) {
      console.error('Error loading levels:', error);
      return [];
    }
  }

  async deleteLevel(levelIndex, category) {
    try {
      if (!auth.currentUser) {
        return false;
      }
      if (category === 'official') {
        await deleteDoc(doc(db, 'official_levels', `level_${levelIndex}`));
      } else {
        await deleteDoc(doc(db, `users/${auth.currentUser.uid}/community_levels`, `level_${levelIndex}`));
      }
      return true;
    } catch (error) {
      console.error('Error deleting level:', error);
      return false;
    }
  }

  async savePlayerProgress(progress) {
    try {
      await setDoc(doc(db, 'progress', 'player'), {
        ...progress,
        updatedAt: new Date()
      });
      return true;
    } catch (error) {
      console.error('Error saving progress:', error);
      return false;
    }
  }

  async loadPlayerProgress() {
    try {
      const docRef = doc(db, 'progress', 'player');
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? docSnap.data() : null;
    } catch (error) {
      console.error('Error loading progress:', error);
      return null;
    }
  }

  async publishLevel(levelIndex, levelData) {
    try {
      // Verify level has required components
      if (!levelData.blocks || levelData.blocks.length === 0) {
        throw new Error('Level must have blocks');
      }
      
      // Check for end block
      const hasEndBlock = levelData.blocks.some(block => block.type === 'end');
      if (!hasEndBlock) {
        throw new Error('Level must have an end block');
      }
      
      // Check if level has been completed by the author
      const completionKey = `level_${levelIndex}`;
      const levelCompletions = JSON.parse(localStorage.getItem('platformer_completions') || '{}');
      if (!levelCompletions[completionKey]) {
        throw new Error('You must complete the level before publishing it');
      }
      
      // Add author info
      const authorName = auth.currentUser.email ? 
        auth.currentUser.email.replace('@platformer.local', '') : 
        (auth.currentUser.displayName || 'Anonymous');
      
      const publishData = {
        ...levelData,
        publishedAt: new Date(),
        levelIndex: levelIndex,
        isPublished: true,
        author: authorName,
        authorId: auth.currentUser.uid,
        verified: true
      };
      
      await setDoc(doc(db, 'published_levels', `level_${levelIndex}_${Date.now()}`), publishData);
      return true;
    } catch (error) {
      console.error('Error publishing level:', error);
      throw error;
    }
  }

  async getPublishedLevels() {
    try {
      const querySnapshot = await getDocs(collection(db, 'published_levels'));
      const levels = [];
      querySnapshot.forEach((doc) => {
        levels.push({ id: doc.id, ...doc.data() });
      });
      return levels;
    } catch (error) {
      console.error('Error loading published levels:', error);
      return [];
    }
  }

  async searchPublishedLevels(searchTerm) {
    try {
      const querySnapshot = await getDocs(collection(db, 'published_levels'));
      const levels = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.name && data.name.toLowerCase().includes(searchTerm.toLowerCase())) {
          levels.push({ id: doc.id, ...data });
        }
      });
      return levels;
    } catch (error) {
      console.error('Error searching published levels:', error);
      return [];
    }
  }
}

export const firebaseService = new FirebaseService();