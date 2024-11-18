// Import Firebase scripts (ensure these URLs are accessible in your app)
importScripts('/firebase-app.js');
importScripts('/firebase-messaging.js');

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBSo1jLzo9n7-N2uuYOAO7n5-gDax0O5Lc",
  authDomain: "mcark-55e54.firebaseapp.com",
  projectId: "mcark-55e54",
  storageBucket: "mcark-55e54.firebasestorage.app",
  messagingSenderId: "860357315745",
  appId: "1:860357315745:web:bad8bba7efbb655ddff4e0",
});

// Get an instance of Firebase Messaging
const messaging = firebase.messaging();

// Optional: Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
