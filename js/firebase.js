
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVpl3DC93wjPCjj4nA02GDjGRrgEtm8U4",
  authDomain: "campusfind1014.firebaseapp.com",
  projectId: "campusfind1014",
  storageBucket: "campusfind1014.firebasestorage.app",
  messagingSenderId: "999978246685",
  appId: "1:999978246685:web:73cc1f42066a6532b6dcf4",
  measurementId: "G-42TD3ZKLT1"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const reportsCollection = collection(db, "reports");

export {
  app,
  db,
  reportsCollection,
  addDoc,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  serverTimestamp
};
