// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove, onDisconnect } from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC7bOWP6coGpbtEkF6tRUkYPL_3FEo9ie4",
  authDomain: "ai-ra-chatbot.firebaseapp.com",
  databaseURL: "https://ai-ra-chatbot-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "ai-ra-chatbot",
  storageBucket: "ai-ra-chatbot.appspot.com",
  messagingSenderId: "521178102403",
  appId: "1:521178102403:web:fc5e034278bdf7910c79b6",
  measurementId: "G-HPWSFNMJVM"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);  // Ensure you pass `app` here for initialization

export { auth, database, ref, get, set, onValue, remove, onDisconnect, signInAnonymously, onAuthStateChanged };
