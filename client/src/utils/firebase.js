// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  authDomain: "interviewiq-28c73.firebaseapp.com",
  projectId: "interviewiq-28c73",
  storageBucket: "interviewiq-28c73.firebasestorage.app",
  messagingSenderId: "778181787042",
  appId: "1:778181787042:web:fafb126d5a98c73e4906fb"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app);
const provider=new GoogleAuthProvider()
export {auth,provider}