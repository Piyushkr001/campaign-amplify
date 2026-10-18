# Campaign Amplify

A mobile platform for community-funded message amplification and distribution built with **React Native**, **Expo (SDK 58)**, **TypeScript**, and **Express + Drizzle ORM + Neon PostgreSQL**, powered by **Bun**.

> **Important Concept**: Campaign Amplify is **NOT a donation platform**. Backer contributions directly fund targeted advertising and digital media placement to amplify important civic, environmental, and public-interest messages to new audiences.

---

## 🛠️ Tech Stack & Architecture

- **Mobile Client**:
  - React Native 0.88, Expo SDK 58
  - Navigation: Expo Router v4 (file-based routing under `src/app/`)
  - State Management: [Zustand](https://github.com/pmndrs/zustand) with `@react-native-async-storage/async-storage` local persistence
  - Data Fetching: [TanStack Query v5](https://tanstack.com/query) (`@tanstack/react-query`) + Axios
  - Validation: [Zod](https://zod.dev/)
  - Package Manager: [Bun](https://bun.sh/) (use `bun` / `bunx` exclusively)
- **Backend API**:
  - Express.js 4.21, TypeScript 5.7
  - Database: [Neon](https://neon.tech/) Serverless PostgreSQL
  - ORM: Drizzle ORM 0.38 + Drizzle Kit
  - Located in `server/`

---

## 🚀 Dual Mode Architecture (Local Mode vs. API Mode)

The application supports both an offline-capable local prototype mode and a live PostgreSQL backend mode.

### 1. Local Mode (`EXPO_PUBLIC_USE_API=false`)
- Operates entirely client-side using Zustand stores, mock campaigns, and local `AsyncStorage`.
- Campaign creation drafts are preserved in device storage.
- Ideal for fast offline demos, testing UI flows, and presentations without internet or database configuration.

### 2. API Mode (`EXPO_PUBLIC_USE_API=true`)
- Uses Axios to communicate with the Express + Neon PostgreSQL backend.
- **Read Path**: Explore and Campaign Detail query live PostgreSQL tables with server-side sorting (`newest`, `most_funded`, `ending_soon`, `featured`), text search, and category filtering.
- **Write Path**: 5-step campaign creation creates a server draft (`POST /campaigns`), persists step updates (`PATCH /basics`, `/story`, `/visuals`, `/reach`), and submits the campaign (`POST /submit`) with server-side completeness validation.
- **Offline Resiliency**: Device AsyncStorage drafts remain intact as an offline cache. If a network call fails, the draft is still saved on the device with a user-friendly sync notification.

---

## 📱 Running the Application

### 1. Install Dependencies
```bash
bun install
cd server && bun install && cd ..
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Device-specific API URLs:
- **iOS Simulator**: `EXPO_PUBLIC_API_URL=http://localhost:5001/api/v1`
- **Android Emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5001/api/v1`
- **Physical Device**: `EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:5001/api/v1`

### 3. Backend Setup & Seed
```bash
cd server
cp .env.example .env # Configure your Neon DATABASE_URL
bun run db:migrate
bun run db:seed
bun run dev
```

### 4. Start Expo Mobile App
In the root directory:
```bash
bun expo start
```

Press `i` for iOS Simulator, `a` for Android Emulator, or scan the QR code with Expo Go.

---

## 📋 Available Commands (Bun Only)

```bash
bun expo start              # Start Metro bundler
bunx tsc --noEmit           # Root TypeScript check
cd server && bun run typecheck # Server TypeScript check
bun run db:migrate          # Run Drizzle migrations
bun run db:seed             # Populate idempotent demo data
bun run server              # Start backend dev server
```

---

## 🌐 Backend API Summary

- `GET  /api/v1/health` - Process health check
- `GET  /api/v1/ready` - Database connectivity probe (`SELECT 1`)
- `GET  /api/v1/campaigns` - List public campaigns (with `search`, `sort`, `category`, pagination)
- `GET  /api/v1/campaigns/:id` - Full campaign detail (including editorial story, sources, and targeting)
- `POST /api/v1/campaigns` - Create new campaign draft (`status: DRAFT`)
- `PATCH /api/v1/campaigns/:id/basics` - Step 1: Basics
- `PATCH /api/v1/campaigns/:id/story` - Step 2: Narrative & sources (atomic transaction)
- `PATCH /api/v1/campaigns/:id/visuals` - Step 3: Social ad creative (upsert)
- `PATCH /api/v1/campaigns/:id/reach` - Step 4: Audience targeting (upsert) & duration sync
- `POST /api/v1/campaigns/:id/submit` - Step 5: Complete campaign validation & transition to `SUBMITTED_FOR_REVIEW`

---

## 🔒 Security & Scope Boundaries

- **Demo Identity**: Current write endpoints use a controlled demo creator identifier until JWT authentication is implemented in subsequent phases.
- **Contributions**: Contributions and payments are simulated on the client in this phase to prevent mock contributions from mutating live campaign rows without dedicated payment verification.
