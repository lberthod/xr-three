// src/firebase.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove, onDisconnect , push,runTransaction} from 'firebase/database';
import { getAuth, signInAnonymously, onAuthStateChanged , FacebookAuthProvider, signInWithPopup } from 'firebase/auth';

// Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB8H8RpZqFWUSI_q_XcPg0RleP_0e05DBQ",
  authDomain: "moskito-kill.firebaseapp.com",
  databaseURL: "https://moskito-kill-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "moskito-kill",
  storageBucket: "moskito-kill.appspot.com",
  messagingSenderId: "425171266103",
  appId: "1:425171266103:web:361aa34498ceb59e5d2db2",
  measurementId: "G-NWQ1KG7NN6"
};

// Initialisation de Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);  // Ensure you pass `app` here for initialization

export { auth, database, push, ref, get, set, onValue, remove, onDisconnect, signInAnonymously, onAuthStateChanged ,runTransaction, FacebookAuthProvider, signInWithPopup};
