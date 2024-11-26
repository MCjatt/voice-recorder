# VocalBridge

VocalBridge is a web application designed to help users record words at different pronunciation paces—slow, normal, and fast. Built as a 2-tier application, it integrates frontend and backend technologies to provide a seamless user experience for recording, playback, and managing audio files.

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Challenges Faced](#challenges-faced)
- [Lessons Learned](#lessons-learned)
- [How to Run the Application](#how-to-run-the-application)
- [Acknowledgments](#acknowledgments)

---

## Overview

VocalBridge enables users to:
- Record words at varying paces (slow, normal, fast).
- Playback recorded audio files.
- Manage audio files via upload, view, and delete functionalities.

The application combines the Django framework for backend functionality with Firebase for audio storage. User authentication and permissions are managed using Django's built-in models, ensuring secure and systematic storage.

---

## Features

1. **Audio Recording**  
   - Record words at different paces.
   - Playback recorded audio files.

2. **User Management**  
   - User registration and login handled by Django's authentication system.
   - Permissions for users to upload, view, and delete their recordings.

3. **Cloud Storage Integration**  
   - Audio files stored in Firebase Cloud Storage.
   - Organized storage under each user’s unique username.

---

## Technologies Used

- **Frontend**:  
  - HTML, CSS, JavaScript  
  - Custom media player integration for audio playback.

- **Backend**:  
  - Django Framework (with SQLite for user data management).  
  - Firebase Cloud Storage for storing audio files.  

- **Authentication**:  
  - Django user authentication model.
  - Firebase anonymous authentication for storage rights.

---

## How to Run the Application

1. Clone the repository:  
   ```bash
   git clone https://github.com/AbhijitMahal/VocalBridge.git
