// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove, onDisconnect , push} from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB0WpzEQJ-fsjBFF98ovwxwrrYDCwNBX8Q",
  authDomain: "tete-80d6d.firebaseapp.com",
  databaseURL: "https://tete-80d6d.firebaseio.com",
  projectId: "tete-80d6d",
  storageBucket: "tete-80d6d.appspot.com",
  messagingSenderId: "1030692630539",
  appId: "1:1030692630539:web:776838756680c93085570e"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);  // Ensure you pass `app` here for initialization

export { auth, database, push, ref, get, set, onValue, remove, onDisconnect, signInAnonymously, onAuthStateChanged };
