# Cross-Platform Web Game with Admin, WebXR, Web 2D, and Web 3D Modes

This project is a cross-platform interactive game that provides different experiences depending on the user's platform. It includes an **Admin Interface** for managing the game, a **WebXR mode** for immersive XR interactions, a **Web 2D Game** for standard web interactions, and a **Web 3D Game** for desktop and mobile browsers with 3D capabilities. Firebase is used for real-time data synchronization across all platforms.

## Features

- **Admin Interface**: Manage the game settings, monitor players, and control real-time game data.
- **WebXR Mode**: Offers an immersive experience for XR-enabled devices like the Quest 3.
- **Web 2D Game**: A simplified 2D game interface for web browsers on desktop, mobile, and tablets.
- **Web 3D Game**: A full 3D game experience for web browsers using Three.js.
- **Real-Time Data Synchronization**: Uses Firebase to keep all player actions, game object states, and interactions in sync across all platforms.

## Components

### 1. **Admin Interface (`AdminView.vue`)**

The admin interface allows game administrators to monitor and control the game. Through the admin panel, you can:
- **Monitor Player Activity**: View the list of connected players and their real-time data (e.g., position, interactions).
- **Control Game Objects**: Modify, add, or remove in-game objects such as cubes and treasure chests.
- **Adjust Game Settings**: Control the global game state, including resetting the game or adjusting gameplay parameters.

#### Key Component:
- **`AdminComponent.vue`**: Handles all the core admin functionality, including real-time updates and control logic.

### 2. **XR Experience (`XrExperience.vue`)**

This component offers an immersive experience for WebXR-enabled devices, allowing players to interact with a virtual 3D environment using XR controllers (e.g., Oculus Quest 3). Features include:
- **3D Interactions**: Players can grab, move, and manipulate objects such as cubes.
- **Text Overlays**: Display real-time text feedback and dialogue as part of the immersive experience.
- **Lighting and Environment**: Dynamic lighting and environmental effects enhance the XR experience.

#### Key Components:
- **`CubeComponent.vue`**: Handles individual cubes in the XR environment, allowing real-time color and position changes.
- **`GrabbableCube.vue`**: Allows users to interact with and manipulate cubes in XR.

### 3. **Web 2D Game (`GameView.vue`)**

The Web 2D Game provides a simplified gaming experience for users accessing the game via standard web browsers (desktop, mobile, tablet). The 2D interface includes:
- **Player Info Management**: Allows users to set their name and customize their appearance.
- **Game Objects**: Players can interact with 2D representations of game objects like coins and treasure chests.
- **Overlay Text**: Displays dialogue or messages when players interact with in-game objects, such as opening treasure chests.

#### Key Components:
- **`PlayerComponent.vue`**: Displays and manages player information and actions in the 2D environment.
- **`ChestComponent.vue`**: Represents treasure chests in the 2D game, allowing players to discover and interact with them.
- **`OverlayText.vue`**: Provides feedback to the player via text overlays.

### 4. **Web 3D Game (`WebExperience.vue`)**

The Web 3D Game brings the full 3D experience to web browsers, allowing users to interact with a 3D environment using their mouse or touch input. Features include:
- **3D Scene**: Renders a dynamic 3D scene with interactive objects like cubes and floors.
- **Interactive Elements**: Users can move and interact with 3D objects, similar to the WebXR mode but using standard browser controls.
- **Real-Time Synchronization**: Keeps player actions and object states synchronized across all users in real time.

#### Key Components:
- **`FlooraComponent.vue`**: Renders the 3D floor of the environment.
- **`GrabbableCube.vue`**: Allows users to interact with cubes in the 3D environment.

## Firebase Integration

All game modes (Admin, WebXR, Web 2D, and Web 3D) rely on Firebase for:
- **Real-Time Database**: Synchronizes player actions, object states, and interactions across all platforms in real time.
- **Persistent Data**: Stores player data and game states, ensuring that changes are reflected for all users.

## Getting Started

### Prerequisites
- Node.js
- Vue CLI
- Firebase Project (for real-time synchronization)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/cross-platform-web-game.git
   cd cross-platform-web-game
