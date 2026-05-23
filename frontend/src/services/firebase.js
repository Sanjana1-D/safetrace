import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue, serverTimestamp } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA16Pn_o6qBDhBx0-U1-wOk1hIISQssh5A",
  authDomain: "scamscan-93005.firebaseapp.com",
  databaseURL: "https://scamscan-93005-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "scamscan-93005",
  storageBucket: "scamscan-93005.firebasestorage.app",
  messagingSenderId: "304469160893",
  appId: "1:304469160893:web:72f0b9f5126c855b4498d4",
  measurementId: "G-G3NVM4T4WV",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export { ref, push, onValue, serverTimestamp };
export default app;
