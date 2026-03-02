# Scout Hub

Scout Hub is a modern, offline-first match scouting system designed for FRC (FIRST Robotics Competition) 2026. It provides a seamless scouting experience with real-time synchronization, advanced analytics, and integrated picklist management, powered by a Supabase backend.

## 🚀 Features

- **Offline-First Scouting**: Perform match scouting even without an internet connection. Data is saved locally and automatically synced to the Supabase database when a connection is restored.
- **Real-Time Data Sync**: Synchronize scouting data across multiple devices instantly using a REST API backed by Supabase.
- **Advanced Performance Analytics**:
    - Automatic calculation of averages, medians, and standard deviations for cycles.
    - **Success Rate Tracking**: Detailed metrics for actions like Clambering and Preload scoring.
    - defensive effectiveness and driver skill ratings.
    - Comprehensive team detail views with statistical breakdowns and visual charts.
- **Intelligent Picklists**:
    - Rank-based picklist management with manual overrides and automatic sorting.
    - Integrated team scouting history and pit data in the picklist view.
- **TBA & OPR Integration**: 
    - Automatic event and team data fetching via The Blue Alliance API.
    - **Live OPR Integration**: Fetch and display real-time OPR (Offensive Power Rating) data for performance estimation.
- **Admin Management**: 
    - Password-protected **Admin Mode** for secure data management.
    - **Dynamic Event Key Switching**: Instantly switch the entire application to a different FRC event.
    - **Data Cleanup**: Batch delete teams or individual entries directly from the UI.
- **Data Export**: Export match and pit scouting data to **CSV** for external analysis in Excel or Tableau.
- **Progressive Web App (PWA)**: Installable on mobile devices with smart reload prompts and background sync capabilities.

## 🏗️ Architecture

Scout Hub uses a modern full-stack architecture optimized for reliability and speed:

- **Frontend**:
    - Built with **React** and **Vite**.
    - Styled using **Tailwind CSS** and **Radix UI** for a premium, accessible interface.
    - State management with **TanStack Query** (React Query) for efficient caching.
    - Offline-first logic with **Vite PWA**, Custom Service Workers, and **localStorage** persistence.
- **Backend**:
    - **Express.js** lightweight server acting as a bridge to Supabase.
    - **Supabase (PostgreSQL)**: Primary data store for match entries, pit data, and application configuration.
    - **TypeScript**: Shared types across frontend and backend for maximum reliability.

## 🛠️ Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [Supabase Account](https://supabase.com/) (Free tier works perfectly)
- [Bun](https://bun.sh/) (optional, but recommended for development speed)

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
   # Frontend
   VITE_API_URL=http://localhost:3001/api
   VITE_TBA_API_KEY=your_blue_alliance_api_key

   # Backend (Supabase)
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # Admin Security
   PORT=3001
   ```

### Running the Application

1. **Start the Development Servers**:
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
- `npm run test`: Runs the Vitest test suite.

## 💻 Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Radix UI, Lucide React, Zod, React Hook Form, TanStack Query, Recharts, Vite PWA, Sonner.
- **Backend**: Node.js, Express, Supabase (@supabase/supabase-js), tsx.
- **Deployment**: Optimized for **Vercel** or Docker-based hosting.

