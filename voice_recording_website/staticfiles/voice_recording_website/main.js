// Ensure the entire file is wrapped in an async function to use top-level await
(async function () {
    // Check DOM content after DOMContentLoaded event
    console.log("main.js is loaded");
    document.addEventListener("DOMContentLoaded", async () => {
        console.log("Checking DOM content after DOMContentLoaded");
        console.log(document.body.innerHTML);

        // Firebase configuration
        const firebaseConfig = {
            apiKey: "AIzaSyB4ykquflHJz1Xc99buI4vLrzsh8-v1lDs",
            authDomain: "voice-recorder-intra.firebaseapp.com",
            databaseURL: "https://voice-recorder-intra-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "voice-recorder-intra",
            storageBucket: "voice-recorder-intra.appspot.com",
            messagingSenderId: "959796633515",
            appId: "1:959796633515:web:22989cf5f2d19b5f9bfcee",
            measurementId: "G-0XT8VHBYPW"
        };

        try {
            // Initialize Firebase
            const app = firebase.initializeApp(firebaseConfig);
            console.log("Firebase initialized:", app);

            // Initialize Firebase Auth
            const auth = firebase.auth();
            console.log("Firebase Auth:", auth);

            // Anonymous sign-in using pop-up method
            await auth.signInAnonymously().then(() => {
                console.log("Signed in anonymously to Firebase");
            }).catch((error) => {
                console.error("Error signing in anonymously:", error);
            });

            // Initialize Firebase Realtime Database and Storage
            window.firebaseDB = firebase.database();
            window.firebaseStorage = firebase.storage();

            // Fetch audios for the current user
            const fetchAudios = async () => {
                const username = djangoUsername;
                console.log("Fetching audios for username:", username);

                try {
                    const audiosRef = window.firebaseDB.ref('audios');
                    const query = audiosRef.orderByChild('username').equalTo(username);
                    const snapshot = await query.once('value');

                    if (snapshot.exists()) {
                        window.fetchedAudios = [];
                        const audios = snapshot.val();
                        console.log("Fetched audios:", audios);
                        for (const key in audios) {
                            const audio = audios[key];
                            window.fetchedAudios.push(audio);
                        }
                        console.log("window.fetchedAudios populated:", window.fetchedAudios);
                        document.dispatchEvent(new CustomEvent('audiosFetched', { detail: window.fetchedAudios }));
                    } else {
                        console.log("No audios found for user:", username);
                    }
                } catch (error) {
                    console.error("Error fetching audios:", error);
                }
            };

            await fetchAudios();

            // Example for Google Sign-in using a pop-up window (optional)
            const googleSignInButton = document.getElementById('googleSignInButton');
            if (googleSignInButton) {
                googleSignInButton.addEventListener('click', async () => {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    await auth.signInWithPopup(provider).then((result) => {
                        console.log("Signed in with Google:", result);
                    }).catch((error) => {
                        console.error("Error signing in with Google:", error);
                    });
                });
            }

            // Logout functionality
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', async () => {
                    try {
                        await auth.signOut();
                        console.log("Signed out from Firebase");
                        // Redirect to Django login page
                        window.location.href = "/accounts/login/"; // Adjust the URL as needed for your Django login page
                    } catch (error) {
                        console.error("Error signing out:", error);
                    }
                });
            }

        } catch (error) {
            console.error("Error initializing Firebase:", error);
            alert("Error initializing Firebase: " + error.message);
        }
    });
})();
