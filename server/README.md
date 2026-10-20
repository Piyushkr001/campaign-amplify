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

### 5. Contribution & Payment APIs
- **`POST /api/v1/campaigns/:id/contributions/quote`**: Computes authoritative server breakdown according to `CAMPAIGN_POLICY` (85% advertising, 10% platform, 5% processing; 20-30 estimated impressions per ad dollar).
- **`POST /api/v1/campaigns/:id/contributions`**: Creates a new contribution record in `PENDING` status for a campaign that is currently in `FUNDING` state. Returns `409 CAMPAIGN_NOT_BACKABLE` if the campaign has already closed or reached its goal.
- **`POST /api/v1/payments/simulate`**: Simulates payment processing (`SUCCESS`, `FAILED`, `CANCELLED`).
  - **Transactional Execution**: On `SUCCESS`, atomically updates payment to `SUCCESS`, contribution to `CONFIRMED`, increments campaign `amountRaised` and `backerCount` using atomic SQL expressions, and conditionally transitions campaign to `FUNDING_GOAL_REACHED` if `amountRaised >= fundingGoal`.
  - **Idempotency Guarantee**: If a `SUCCESS` request is submitted more than once for the same contribution, the endpoint returns the existing successful transaction record without double-incrementing campaign funding.
  - **Zero Card Data Stored**: Never logs or stores card numbers, CVVs, or expirations; only stores optional masked `cardLast4`.
- **`GET /api/v1/me/contributions`**: Returns the current demo backer's contribution history.
- **`GET /api/v1/me/contributions/:id`**: Returns detailed contribution record with fee breakdown, impact impressions, and payment metadata.
- **`GET /api/v1/me/contributions/:id/receipt`**: Returns verified demo sponsorship receipt for confirmed contributions. Includes standard non-donation disclaimer.

---

## 💰 Money Representation Decision
The platform consistently uses **whole-dollar integer representation** across all database columns and API contracts:
- `campaigns.funding_goal`: integer (e.g., `10000` = $10,000)
- `campaigns.amount_raised`: integer (e.g., `2500` = $2,500)
- `contributions.amount`: integer (e.g., `100` = $100)
- `payments.amount`: integer (e.g., `100` = $100)
This model ensures complete consistency with existing seeded campaigns and UI formatters without fractional cent drift.

---

## 🧪 Automated Integration Tests

Run the full suite of automated server-side integration tests against Neon PostgreSQL:

```bash
cd server

# 1. Draft Sync & Multi-step Persistence Test Suite
bun run test:sync

# 2. Editorial Review & Lifecycle State Machine Test Suite
bun run test:lifecycle

# 3. Contribution & Payment Transaction Test Suite
bun run test:contribution
```

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
3. Set `EXPO_PUBLIC_USE_API=true` to enable real backend reads, writes, contributions, and payments.
4. If set to `false`, the mobile app operates in local prototype mode (Zustand + AsyncStorage).
