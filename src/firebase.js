import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdkQpNAJYIqZjTHkKII5NyxVUhPUpF-rg",
  authDomain: "anypercent-97ef0.firebaseapp.com",
  projectId: "anypercent-97ef0",
  storageBucket: "anypercent-97ef0.firebasestorage.app",
  messagingSenderId: "935507333353",
  appId: "1:935507333353:web:36f7c0f49d6c80e0a02078",
  measurementId: "G-Y4D5ZNKNFJ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);