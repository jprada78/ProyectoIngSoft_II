const firebaseConfig = {
  apiKey: "AIzaSyB6cY-505pwjzPa6329QxQS1X9zua-4HZQ",
  authDomain: "papeleriasmartcontrol.firebaseapp.com",
  projectId: "papeleriasmartcontrol",
  storageBucket: "papeleriasmartcontrol.firebasestorage.app",
  messagingSenderId: "121205797612",
  appId: "1:121205797612:web:45fe9fc265f6ea5fbd2bc9",
  measurementId: "G-7HJ3GVNQJ9"
};

firebase.initializeApp(firebaseConfig);

const firebaseAuth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// Fuerza a Google a mostrar el selector de cuenta siempre
googleProvider.setCustomParameters({
  prompt: "select_account"
});
