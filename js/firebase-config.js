import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDnKA1lBYAgLIH0Mc-m9tVCWM9yKEMGJYw",
  authDomain: "ujikom-iot-2026.firebaseapp.com",
  databaseURL: "https://ujikom-iot-2026-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ujikom-iot-2026",
  storageBucket: "ujikom-iot-2026.firebasestorage.app",
  messagingSenderId: "571689415299",
  appId: "1:571689415299:web:288b97d8f60999ddf821b6",
  measurementId: "G-5YV36S1DDL"
}; // ← tambahkan ini

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
export default app;