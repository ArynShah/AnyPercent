# Any% ⏱️

**Play it live:** [https://any-percent.vercel.app](https://any-percent.vercel.app)

Any% is a web application that brings the competitive excitement of video game speedrunning to everyday, mundane tasks. Whether it's washing dishes, making your bed, or eating a hotdog, you can time your splits, submit your runs, and climb the leaderboards!

## Features

* **Categorized Zones & Tasks:** Navigate through different sectors like Kitchen, Food, Bedroom, Washroom, Everyday, and Outdoor to find tasks to speedrun.
* **LiveSplit-Style Timer:** Features a built-in, highly accurate timer that allows you to record splits for multi-step tasks.
* **Global & Friends Leaderboards:** Compete against the entire world or filter the leaderboards to only show times from runners in your network.
* **Video Proof Integration:** Submit YouTube or VOD links alongside your runs so the community can verify your times.
* **Social Network:** Follow your friends and other top runners to keep track of their latest records.
* **User Profiles:** Customize your display name and build your speedrunning reputation.

## Tech Stack

* **Frontend:** React, Vite, Tailwind CSS
* **Backend & Database:** Firebase (Authentication, Firestore)
* **Deployment:** Vercel

## Getting Started

If you want to run the project locally for development, follow these steps:

### Prerequisites

* Node.js installed on your machine.
* A Firebase account for database and authentication.

### Installation

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/arynshah/anypercent.git](https://github.com/arynshah/anypercent.git)
   cd anypercent
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Firebase Setup:**
   * Go to the [Firebase Console](https://console.firebase.google.com/) and create a new project.
   * Enable **Authentication** (Email/Password and Google sign-in).
   * Enable **Firestore Database**.
   * Copy your Firebase configuration object.
   * Update the configuration inside `src/firebase.js` with your own project's keys.

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:5173` to see the app running.

## Project Structure

* `src/App.jsx`: Contains the core application logic, state management, timer functionality, and all the UI views.
* `src/firebase.js`: Initializes and exports the Firebase Auth and Firestore instances.
* `src/index.css`: Global styles, custom animations (like the timer shake and bubbly background), and Tailwind imports.
* `src/assets/`: Contains project imagery, including the Any% logo.

## Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to help improve the Any% speedrunning experience.

## License

This project is open-source and available under the MIT License.