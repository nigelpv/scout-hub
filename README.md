# Scout Hub

Scout Hub is a modern, offline-first match scouting system designed for FRC (FIRST Robotics Competition) 2026. It provides a seamless scouting experience with real-time synchronization, advanced analytics, and integrated picklist management.

## 🚀 Features

- **Offline-First Scouting**: Perform match scouting even without an internet connection. Data is saved locally and automatically synced when a connection is restored.
- **Real-Time Data Sync**: Synchronize scouting data across multiple devices instantly when online.
- **Advanced Performance Analytics**:
    - Automatic calculation of averages, medians, and standard deviations for cycles.
    - Preload success rate tracking.
    - Defensive effectiveness and driver skill ratings.
    - Comprehensive team detail views with statistical breakdowns.
- **Intelligent Picklists**:
    - Rank-based picklist management.
    - Manual overrides and automatic sorting.
    - Team-specific scouting history integrated into the picklist view.
- **TBA Integration**: Automatic event and team data fetching via The Blue Alliance API.
- **Progressive Web App (PWA)**: Installable on mobile devices for a native app-like experience in the pits.

## 🏗️ Architecture

Scout Hub uses a modern full-stack architecture:

- **Frontend**:
    - Built with **React** and **Vite**.
    - Styled using **Tailwind CSS** and **Radix UI** for a premium, accessible UI.
    - Managed state with **React Query** for efficient data fetching and caching.
    - Offline capabilities provided by **Vite PWA** and custom **localStorage** synchronization logic.
- **Backend**:
    - Lightweight **Express.js** server.
    - **PostgreSQL** database for persistent storage.
    - **TypeScript** for type safety across the entire stack.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [PostgreSQL](https://www.postgresql.org/) database
- [Bun](https://bun.sh/) (optional, but recommended for speed)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/nigelpv/scout-hub.git
   cd scout-hub
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```env
   # Backend
   DATABASE_URL=postgresql://username:password@localhost:5432/scout_hub
   PORT=3001

   # Frontend
   VITE_API_URL=http://localhost:3001/api
   VITE_TBA_API_KEY=your_blue_alliance_api_key
   ```

### Running the Application

1. **Start the Development Server**:
   ```bash
   # Start the frontend (Vite)
   npm run dev

   # Start the backend (Express) in a separate terminal
   npm run dev:server
   ```

2. **Build for Production**:
   ```bash
   npm run build
   npm run build:server
   ```

## 📜 Scripts

- `npm run dev`: Starts the Vite development server.
- `npm run dev:server`: Starts the Express backend with `tsx watch`.
- `npm run build`: Builds the frontend for production.
- `npm run build:server`: Compiles the server TypeScript code.
- `npm run test`: Runs the test suite using Vitest.

## 💻 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI, Lucide React, Zod, React Hook Form, TanStack Query, Recharts, Vite PWA.
- **Backend**: Node.js, Express, PostgreSQL (node-pg), tsx.
- **Deployment**: Configured for modern hosting platforms with Docker support potential.

