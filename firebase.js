import { initializeApp, getApps, getApp } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js";

import { getFirestore } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-firestore.js";

import { getAuth } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-auth.js";

import { getStorage } 
from "https://www.gstatic.com/firebasejs/12.12.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "...",
    authDomain: "developer-wiki-31ea9.firebaseapp.com",
    projectId: "developer-wiki-31ea9",
    storageBucket: "developer-wiki-31ea9.firebasestorage.app",
    messagingSenderId: "305676986631",
    appId: "1:305676986631:web:893587ce1f950fb5a8bda2"
};

/* 🔥 핵심 코드 */
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);