# Campaign Amplify API Server

A high-performance Node.js backend built with Express, TypeScript, Drizzle ORM, and Neon PostgreSQL for the **Campaign Amplify** mobile application.

---

## 🛠️ Technology Stack

- **Runtime & Package Manager**: [Bun](https://bun.sh/) (use `bun` and `bunx` exclusively)
- **Framework**: Express.js 4.21
- **Database**: [Neon](https://neon.tech/) Serverless PostgreSQL
- **ORM & Migrations**: Drizzle ORM 0.38 & Drizzle Kit 0.30
- **Validation**: Zod 3.24
- **Security**: Helmet, CORS

---

## 📋 Requirements

- Bun 1.0+ (`curl -fsSL https://bun.sh/install | bash`)
- Neon PostgreSQL database instance (or any standard PostgreSQL 15+ database)

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd server
bun install
```

### 2. Environment Variables

Copy the example environment configuration:

```bash
cp .env.example .env
```

Configure your `.env` file:

```env
PORT=5001
NODE_ENV=development
CLIENT_URL=http://localhost:8081
DATABASE_URL=postgresql://<user>:<password>@<ep-pooler-xyz>.neon.tech/campaign_amplify?sslmode=require
```

> **Security Note:** Never commit `.env` or expose `DATABASE_URL` inside client-facing Expo bundles.

---

## 🗄️ Database Migrations & Seeds

### Generate Migrations (Drizzle Kit)

```bash
bun run db:generate
```

### Apply Migrations to Neon Database

```bash
bun run db:migrate
```

Or push the schema directly in rapid prototyping:

```bash
bun run db:push
```

### Seed Demo Campaigns (Idempotent)

Populates deterministic demo campaigns with mixed lifecycle states (`FUNDING`, `PROMOTING`, `COMPLETED`).
This script can be run multiple times safely without producing duplicate rows or orphaned foreign keys:

```bash
bun run db:seed
```

---

## 💻 Running the Server

### Development Mode (with hot-reload)

```bash
bun run dev
```

### Type Checking

```bash
bun run typecheck
```

### Production Build & Run

```bash
bun run build
bun run start
```

---

## 🌐 API Endpoints

Default Base URL: `http://localhost:5001/api/v1`

### 1. Process Health & Database Readiness
- **`GET /api/v1/health`**: Process health check (uptime, node env, timestamp).
- **`GET /api/v1/ready`**: Database readiness check (`SELECT 1`). Returns `200` with status `ready` if Neon is connected, or `503 Service Unavailable` if database is unreachable.

### 2. List Public Campaigns
- **Endpoint**: `GET /api/v1/campaigns`
- **Auth**: None (Public)
- **Query Parameters**:
  - `category` (optional, string)
  - `status` (optional, string: public lifecycle states)
  - `search` (optional, string: searches title, creator, summary, category)
  - `sort` (optional: `featured` | `newest` | `most_funded` | `ending_soon`)
  - `limit` (optional, integer: 1–50, default: 20)
  - `offset` (optional, integer: default 0)
- **DTO**: Returns lightweight `CampaignListDTO` array optimized for discovery cards.

### 3. Public Campaign Detail
- **Endpoint**: `GET /api/v1/campaigns/:id`
- **Auth**: None (Public)
- **DTO**: Returns full `CampaignDetailDTO` including editorial story, sources, ad creative hook, and full targeting metadata (`locations`, `interests`, `channels`, `audienceDescription`).
- **Access Rule**: Only public states (`FUNDING`, `FUNDING_GOAL_REACHED`, `FUNDING_ENDED`, `DISTRIBUTION_PREPARATION`, `PROMOTING`, `COMPLETED`) are returned publicly. Private drafts return `404 Not Found`.

### 4. Campaign Draft & Write APIs (Creator Flow)
All write endpoints use demo creator credentials until JWT authentication is introduced in subsequent phases.

- **`POST /api/v1/campaigns`**: Creates a new campaign in `DRAFT` state. Returns `{ id, status: "DRAFT" }`.
- **`PATCH /api/v1/campaigns/:id/basics`**: Updates Step 1 basics (`title`, `category`, `creatorName`, `summary`, `coverImage`).
- **`PATCH /api/v1/campaigns/:id/story`**: Updates Step 2 editorial narrative (`storyHeadline`, `storyIntro`, `storyContent`, `storyImage`, `suggestedAction`, and replaces `sources` in an atomic database transaction).
- **`PATCH /api/v1/campaigns/:id/visuals`**: Updates Step 3 ad creative (`adImage`, `adHeadline`, `adDescription`, `adCTA`) with atomic upsert into `ad_creatives`.
- **`PATCH /api/v1/campaigns/:id/reach`**: Updates Step 4 reach targeting (`locations`, `interests`, `channels`, `audienceDescription`) with atomic upsert into `campaign_targeting` and syncs authoritative `durationDays` to the campaign record.
- **`POST /api/v1/campaigns/:id/submit`**: Step 5 final submission. Performs full validation across all 5 steps (Basics, Story, Visuals, Reach, Funding Goal). If any required field is missing, returns `400 Bad Request` with `CAMPAIGN_INCOMPLETE` error details. On success, atomically transitions state to `SUBMITTED_FOR_REVIEW`, sets `submittedAt`, and records an entry in `campaign_status_history`.

---

## 📱 Mobile Client Integration

In the root React Native / Expo application:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure device URL:
   - **iOS Simulator**: `EXPO_PUBLIC_API_URL=http://localhost:5001/api/v1`
   - **Android Emulator**: `EXPO_PUBLIC_API_URL=http://10.0.2.2:5001/api/v1`
   - **Physical Device**: `EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:5001/api/v1`
3. Set `EXPO_PUBLIC_USE_API=true` to enable real backend reads and writes.
4. If set to `false`, the mobile app operates in local prototype mode (Zustand + AsyncStorage).
