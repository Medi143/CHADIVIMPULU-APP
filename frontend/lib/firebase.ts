import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCps2tB6OzPQpsP7AY3nGn8YxtYNsVwYB8",
  authDomain: "chadivimpulu6.firebaseapp.com",
  projectId: "chadivimpulu6",
  storageBucket: "chadivimpulu6.firebasestorage.app",
  messagingSenderId: "69108737678",
  appId: "1:69108737678:web:adc22de895954e7ec48bdf",
  measurementId: "G-DSG7K49LSS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
