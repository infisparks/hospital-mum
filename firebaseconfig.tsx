import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBSxxT5S_0VGjZ4O0Ykob3RKJLoXRdTyek",
  authDomain: "hospital-63094.firebaseapp.com",
  databaseURL: "https://hospital-63094-default-rtdb.firebaseio.com",
  projectId: "hospital-63094",
  storageBucket: "hospital-63094.firebasestorage.app",
  messagingSenderId: "216178061485",
  appId: "1:216178061485:web:22f1d823989bbcbb291624",
  measurementId: "G-FLM0D0R6KN"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;