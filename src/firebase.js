// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCUxtOoI4gdWLJ8HiEHTNS2ntR6LONYHoQ",
    authDomain: "moneypath-7777.firebaseapp.com",
    projectId: "moneypath-7777",
    storageBucket: "moneypath-7777.firebasestorage.app",
    messagingSenderId: "719877407167",
    appId: "1:719877407167:web:3f0d00856178b12beba10a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);