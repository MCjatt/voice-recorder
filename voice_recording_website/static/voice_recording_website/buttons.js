document.addEventListener("DOMContentLoaded", () => {
    console.log("buttons.js is loaded");

    const domElements = {
        logoutBtn: document.getElementById('logoutBtn'),
        mic_btn: document.getElementById('mic'),
        playback: document.querySelector('audio.playback'),
        downloadLink: document.getElementById('download'),
        audioNameForm: document.getElementById('audioNameForm'),
        audioNameInput: document.getElementById('audioName'),
        saveAudioBtn: document.getElementById('saveAudio'),
        audioList: document.getElementById('audioList')
    };

    console.log("DOM elements:", domElements);

    let mediaRecorder;
    let audioChunks = [];
    let recordingTimer;

    const waitForFirebaseInitialization = async () => {
        return new Promise((resolve) => {
            const checkFirebaseInitialization = () => {
                if (window.firebaseDB && window.firebaseStorage) {
                    resolve(true);
                } else {
                    console.log("Firebase not yet initialized. Retrying...");
                    setTimeout(checkFirebaseInitialization, 100);
                }
            };
            checkFirebaseInitialization();
        });
    };

    const saveAudioToFirebase = async (audioBlob, audioName) => {
        try {
            await waitForFirebaseInitialization();

            const storageRef = window.firebaseStorage.ref();
            const audioPath = `audios/${djangoUsername}/${audioName}.wav`;
            console.log("Saving audio at path:", audioPath); // Debugging information
            const audioRef = storageRef.child(audioPath);
            const snapshot = await audioRef.put(audioBlob);
            const audioUrl = await snapshot.ref.getDownloadURL();

            const audioData = {
                name: audioName,
                url: audioUrl,
                username: djangoUsername,
                timestamp: firebase.database.ServerValue.TIMESTAMP
            };

            const newAudioKey = window.firebaseDB.ref().child('audios').push().key;
            const updates = {};
            updates[`/audios/${newAudioKey}`] = audioData;

            await window.firebaseDB.ref().update(updates);

            console.log("Audio saved to Firebase:", audioData);
            displayAudio(audioData, newAudioKey); // Display the new audio
        } catch (error) {
            console.error("Error saving audio to Firebase:", error);
        }
    };

    const displayAudio = (audio, audioKey) => {
        const listItem = document.createElement('div');
        listItem.classList.add('audio-item');
        listItem.innerHTML = `
            <p>${audio.name}</p>
            <audio controls src="${audio.url}"></audio>
            <a class="download-btn" href="${audio.url}" download="${audio.name}.wav">Share</a>
            <button class="delete-btn" data-key="${audioKey}" data-url="${audio.url}">Delete</button>
        `;
        domElements.audioList.appendChild(listItem);

        // Add event listener to the delete button
        listItem.querySelector('.delete-btn').addEventListener('click', async (event) => {
            const key = event.target.getAttribute('data-key');
            const url = event.target.getAttribute('data-url');
            await deleteAudioFromFirebase(key, url);
            listItem.remove(); // Remove the item from the DOM
        });

        console.log("Displayed audio:", audio);
    };

    const deleteAudioFromFirebase = async (audioKey, audioUrl) => {
        try {
            await waitForFirebaseInitialization();

            // Delete from Realtime Database
            const audioRef = window.firebaseDB.ref(`audios/${audioKey}`);
            await audioRef.remove();
            console.log("Audio deleted from Firebase Database:", audioKey);

            // Extract the storage path from the URL
            const decodedUrl = decodeURIComponent(audioUrl);
            const storagePath = decodedUrl.split("/o/")[1].split("?alt=")[0].replace(/%2F/g, '/');
            console.log("Decoded URL:", decodedUrl); // Debugging information
            console.log("Constructed storage path:", storagePath); // Debugging information

            // Compare with actual path from Firebase Console
            console.log("Please verify the path in Firebase Storage Console matches:", storagePath);

            const storageRef = window.firebaseStorage.ref(storagePath);
            await storageRef.delete();
            console.log("Audio deleted from Firebase Storage:", storagePath);

        } catch (error) {
            console.error("Error deleting audio from Firebase:", error);
        }
    };

    const setupEventListeners = () => {
        if (domElements.logoutBtn) {
            domElements.logoutBtn.style.display = 'block'; // Ensure logout button is visible
            domElements.logoutBtn.addEventListener('click', async () => {
                console.log("Logout button clicked");
                await firebase.auth().signOut();
                console.log("Signed out from Firebase");
                // Redirect to Django login page
                window.location.href = "/accounts/login/"; // Adjust the URL as needed for your Django login page
            });
        }

        if (domElements.mic_btn) {
            domElements.mic_btn.style.display = 'flex';  // Ensure mic button is visible
            domElements.mic_btn.addEventListener('click', async () => {
                console.log("Mic button clicked");

                if (!mediaRecorder || mediaRecorder.state === 'inactive') {
                    // Start countdown before recording
                    startCountdown(3, () => {
                        startRecording();
                    });
                } else if (mediaRecorder.state === 'recording') {
                    stopRecording();
                }
            });
        }

        if (domElements.saveAudioBtn) {
            domElements.saveAudioBtn.style.display = 'block';  // Ensure save audio button is visible
            domElements.saveAudioBtn.addEventListener('click', async () => {
                console.log("Save audio button clicked");
                const audioName = domElements.audioNameInput.value;
                if (!audioName) {
                    alert("Please enter an audio name");
                    return;
                }

                if (!mediaRecorder || mediaRecorder.state !== 'inactive') {
                    alert("Please record an audio first");
                    return;
                }

                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
                await saveAudioToFirebase(audioBlob, audioName);
            });
        }

        document.addEventListener('audiosFetched', (event) => {
            const fetchedAudios = event.detail;
            console.log("Received audiosFetched event with data:", fetchedAudios);
            for (const key in fetchedAudios) {
                const audio = fetchedAudios[key];
                displayAudio(audio, key);
            }
        });
    };

    const startCountdown = (count, callback) => {
        let counter = count;
        domElements.mic_btn.innerHTML = counter;
        const interval = setInterval(() => {
            counter--;
            domElements.mic_btn.innerHTML = counter;
            if (counter <= 0) {
                clearInterval(interval);
                callback();
            }
        }, 1000);
    };

    const startRecording = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.onstart = () => {
            audioChunks = [];
            console.log("Recording started");
            domElements.mic_btn.classList.add('is-recording');
            domElements.mic_btn.innerHTML = '5'; // Start the 5-second recording timer
            startRecordingTimer();
        };

        mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
            const audioUrl = URL.createObjectURL(audioBlob);
            domElements.playback.src = audioUrl;
            console.log("Recording stopped");

            // Enable download link if it exists
            if (domElements.downloadLink) {
                domElements.downloadLink.href = audioUrl;
                domElements.downloadLink.download = `${domElements.audioNameInput.value || 'recording'}.wav`;
                domElements.downloadLink.style.display = 'block';
            }

            domElements.mic_btn.classList.remove('is-recording');
            domElements.mic_btn.innerHTML = '<span class="material-icons">mic</span>';
        };

        mediaRecorder.start();
    };

    const startRecordingTimer = () => {
        let counter = 5;
        domElements.mic_btn.innerHTML = counter;
        recordingTimer = setInterval(() => {
            counter--;
            domElements.mic_btn.innerHTML = counter;
            if (counter <= 0) {
                stopRecording();
            }
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            clearInterval(recordingTimer);
        }
    };

    setupEventListeners();

    const fetchAudios = async () => {
        try {
            const username = djangoUsername;
            console.log("Fetching audios for username:", username);

            const audiosRef = window.firebaseDB.ref('audios');
            const query = audiosRef.orderByChild('username').equalTo(username);
            const snapshot = await query.once('value');

            if (snapshot.exists()) {
                window.fetchedAudios = snapshot.val();
                console.log("Fetched audios:", window.fetchedAudios);
                document.dispatchEvent(new CustomEvent('audiosFetched', { detail: window.fetchedAudios }));
            } else {
                console.log("No audios found for user:", username);
            }
        } catch (error) {
            console.error("Error fetching audios:", error);
        }
    };

    fetchAudios();
});
