// Firebase configuration and initialization

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyBcZfexa5X_7QhFwbBVihCRiN_A8w3li1k",
    authDomain: "attendance-system-f9dd0.firebaseapp.com",
    projectId: "attendance-system-f9dd0",
    storageBucket: "attendance-system-f9dd0.appspot.com",
    messagingSenderId: "878182068092",
    appId: "1:878182068092:web:0375f82e9d7b2d00a47ef9"
  };

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
