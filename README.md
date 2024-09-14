# XR Experience - Vue 3 + Three.js + Firebase

## Overview

This project is an **XR (Extended Reality) Experience** built using **Vue 3**, **Three.js**, and **Firebase**. It integrates support for both **AR (Augmented Reality)** and **VR (Virtual Reality)** environments, and features real-time interactions such as movable 3D cubes and dynamic 3D text. Firebase Realtime Database is used to store and update cube and text data, allowing changes to reflect live in the XR experience.

The project also includes **hand tracking** capabilities, leveraging the WebXR API to interact with 3D elements using hand gestures. The immersive experience is accessible through **VR headsets**, **AR-enabled devices**, or traditional desktop browsers.

## Features

- **AR/VR Support**: Automatic detection of AR/VR device support using WebXR API.
- **Hand Tracking**: Full integration of hand tracking through WebXR for both AR and VR modes.
- **Real-time 3D Scene Updates**: Cubes and text objects are loaded and updated in real-time from Firebase.
- **3D Text Rendering**: Customizable 3D text that is updated live and rendered in the scene.
- **Interactive Cubes**: Users can grab and interact with 3D cubes in the scene.

## Tech Stack

- **Vue 3**: For component-based UI development.
- **Three.js**: For rendering 3D objects, handling AR/VR sessions, and setting up the 3D scene.
- **Firebase**: For real-time data storage and synchronization of cubes and text across devices.
- **WebXR API**: For AR/VR capabilities and hand tracking.

## Installation

### Prerequisites

- **Node.js** and **npm**: Ensure you have these installed. You can download them [here](https://nodejs.org/).
- **Firebase**: A Firebase project set up with the Realtime Database. Make sure to configure Firebase in the project by adding your Firebase config file.

### Steps

1. **Clone the repository**:
    ```bash
    git clone https://github.com/yourusername/xr-experience.git
    ```
2. **Navigate into the project directory**:
    ```bash
    cd xr-experience
    ```
3. **Install dependencies**:
    ```bash
    npm install
    ```
4. **Set up Firebase**:
   - Create a Firebase project at [firebase.google.com](https://firebase.google.com/).
   - Enable the **Realtime Database**.
   - Add your Firebase configuration to a `.env` file or directly to your Firebase config in `firebase.js`.

5. **Run the development server**:
    ```bash
    npm run dev
    ```

6. **Open your browser**:
   Visit `http://localhost:3000` in your browser to see the XR experience.

## Usage

Once the application is running, it will:

- Dynamically load and render cubes from Firebase.
- Allow users with AR/VR headsets to interact with the environment, including hand tracking.
- Update the 3D text in real-time based on Firebase data changes.

## Firebase Configuration

Ensure you set up your Firebase project properly. The following is an example of the Firebase configuration (`firebase.js`):

```javascript
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

export { database };
