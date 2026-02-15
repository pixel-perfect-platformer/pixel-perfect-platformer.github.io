import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js';

const firebaseConfig = {
  apiKey: "AIzaSyD4WmkskTgAsf-EbJSLxI-gO9YpQC6apuY",
  authDomain: "pixel-perfect-platformer.firebaseapp.com",
  projectId: "pixel-perfect-platformer",
  storageBucket: "pixel-perfect-platformer.firebasestorage.app",
  messagingSenderId: "591952190425",
  appId: "1:591952190425:web:550cae0547ef6e0cfd57c8"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);