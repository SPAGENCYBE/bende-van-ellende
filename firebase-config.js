// ===== Bende van ellende: instellingen =====
// Gekoppeld aan het Firebase-project "bende-van-ellende".
// Zet "firebase: null" terug om de app in DEMO-modus te proberen (gegevens alleen op dit toestel).

self.BVE_CONFIG = {
  firebase: {
    apiKey: "AIzaSyAS3f3TwTYWt-8QHXg5SFh0dZTE9MgkHOA",
    authDomain: "bende-van-ellende.firebaseapp.com",
    projectId: "bende-van-ellende",
    storageBucket: "bende-van-ellende.firebasestorage.app",
    messagingSenderId: "43549333820",
    appId: "1:43549333820:web:fe05a63acaec3304362639"
  },

  // Het e-mailadres van het gezinsaccount (stap 4). Wordt alvast ingevuld op het inlogscherm.
  familyEmail: "carlos.van.nieuwenborgh@gmail.com",

  // Publieke sleutel voor pushmeldingen: Firebase → Projectinstellingen → Cloud Messaging → Web Push-certificaten.
  vapidKey: "BJOBZjEXGgxHwm2P5v-gHRtG8k83wQrDXPyuWJq5l0lTioA7d1APMJcnqXV6rfGfflvkP7LRJOhQiUBNawmLd5g"
};
