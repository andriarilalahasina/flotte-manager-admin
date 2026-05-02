import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCuPbLs-aWCL4n7o7jY3FPV4f7qmxiHkpk",
  authDomain: "flotte-t1000.firebaseapp.com",
  projectId: "flotte-t1000",
  storageBucket: "flotte-t1000.firebasestorage.app",
  messagingSenderId: "566228353768",
  appId: "1:566228353768:web:77b08d8a033f821215ff5d",
  measurementId: "G-LXR74G5RVM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn("Multiple tabs open, persistence can only be enabled in one tab at a a time.");
  } else if (err.code == 'unimplemented') {
    console.warn("The current browser does not support all of the features required to enable persistence");
  }
});
