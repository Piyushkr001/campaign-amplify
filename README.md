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

## 🚀 Execution Modes (Local vs. API vs. Strict API)

The application supports three operational configurations:

### 1. Local Mode (`EXPO_PUBLIC_USE_API=false`)
- Operates entirely client-side using Zustand stores, mock campaigns, and local `AsyncStorage`.
- Campaign creation drafts are preserved in device storage.
- Ideal for fast offline demos, testing UI flows, and presentations without internet or database configuration.
- Local draft IDs use client-generated prefixes (`camp-...`).

### 2. API Mode (`EXPO_PUBLIC_USE_API=true`)
- Connects directly to the Express + Neon PostgreSQL backend.
- **Server Draft Identity**: When a new campaign draft is initialized, `POST /campaigns` creates a row in PostgreSQL and assigns a **permanent server UUID**. That identical UUID persists through all 5 creation steps (`/basics`, `/story`, `/visuals`, `/reach`, `/submit`) and is mirrored directly into the local Creator Dashboard upon submission.
- **No Duplicate Identities**: The same UUID is used across both client and server; no secondary local ID is generated for API drafts.
- **Step Navigation Sync**: The mobile client awaits server persistence on step continue buttons before advancing, eliminating race conditions.
- **Pre-Submit Sync Flush**: Before `POST /submit` runs, `syncFullDraftToServer()` flushes all latest steps to the server, ensuring Neon has 100% complete data even if earlier background requests experienced transient issues.
- **No Silent Local Fallback**: In API mode, if the server is unreachable or submission fails, the app preserves your local draft, marks `syncStatus = 'ERROR'`, and displays a clear retry prompt. It **never** silently converts an API submission into a local-only campaign.

### 3. Strict API Mode (`EXPO_PUBLIC_STRICT_API=true`)
- When enabled alongside `EXPO_PUBLIC_USE_API=true`, read endpoints (Explore, Campaign Detail) will **never** silently fall back to mock data if a network or database error occurs.
- Surfaces real backend errors and status codes directly, enabling engineers to debug database connection issues, schema mismatches, and network connectivity without false mock successes.

---

## 🔄 Campaign Draft Model & Sync Lifecycle

### 1. New Campaign vs. Revision
Previous implementations conflated `Boolean(draft.id)` with "this is a revision". In our hardened architecture:
- **`draft.id` represents identity, NOT revision mode.**
- A brand-new API-backed draft possesses a server UUID from Step 1 while maintaining `draft.mode = 'NEW'`.
- `draft.mode = 'REVISION'` is set **only** when loading an existing campaign that is in `CHANGES_REQUESTED` status via `loadCampaignIntoDraft()`.
- The draft card displays **"Active Draft"** for new campaigns (even with a server UUID) and **"Revision in Progress"** only for genuine revisions.

### 2. Explicit Synchronization States (`CampaignSyncStatus`)
Each draft tracks its network synchronization status in real-time:
- **`LOCAL_ONLY`**: Draft exists only on the local device.
- **`PENDING`**: Synchronization request with backend is actively in progress.
- **`SYNCED`**: Latest persisted step data has successfully reached PostgreSQL.
- **`ERROR`**: Local draft is completely safe, but the latest backend synchronization failed. Displays a compact `[Retry]` action in the step indicator.

```
NEW CAMPAIGN:
Mobile Draft (mode: NEW, syncStatus: LOCAL_ONLY)
    ↓
POST /campaigns
    ↓
Server UUID assigned (mode: NEW, syncStatus: SYNCED)
    ↓
Awaited Step PATCH Calls (/basics, /story, /visuals, /reach)
    ↓
Pre-Submit Sync Flush (ensures all 4 steps current on server)
    ↓
POST /submit
    ↓
PostgreSQL status: SUBMITTED_FOR_REVIEW
    ↓
Same server UUID mirrored into Creator Dashboard (No duplicate ID!)
```

```
REVISION CAMPAIGN:
Existing Campaign (status: CHANGES_REQUESTED)
    ↓
loadCampaignIntoDraft(campaign) (mode: REVISION, id: existing_uuid)
    ↓
Edit story/sources/targeting
    ↓
PATCH /campaigns/:id/... (Updates existing row)
    ↓
POST /campaigns/:id/submit
    ↓
Same DB row returns to SUBMITTED_FOR_REVIEW (No duplicate row!)
```

---

## 🖼️ Image Persistence Boundary

- **Remote URLs**: Valid `http://` and `https://` URLs (e.g. Unsplash presets, verified CDN assets) are persisted to Neon PostgreSQL.
- **Device-Local URIs**: Local asset paths from the image picker (`file://`, `content://`, `ph://`, `blob://`) remain strictly stored in local device draft state and are sanitized before sending to the backend (`sanitizeRemoteImageUrl()`). This prevents transient device-local file paths from corrupting database columns.
- Dedicated cloud upload storage (e.g., S3 / Cloudflare R2) will be introduced in a future phase.

---

## 💰 Monetary Values Note

- Current campaign monetary values (`goal`, `raised`) are stored in whole currency units (e.g. USD dollars).
- **TODO before real payment & banking integration**: A migration will transition financial columns to minor currency units (e.g. cents).

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
- **Physical Device**: `EXPO_PUBLIC_API_URL=http://<MACHINE_LAN_IP>:5001/api/v1` (e.g. `http://192.168.1.100:5001/api/v1`)
- **API Mode**: `EXPO_PUBLIC_USE_API=true`
- **Strict Mode (Optional)**: `EXPO_PUBLIC_STRICT_API=true`

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

## 🧪 Automated Testing & Verification

Run the end-to-end sync hardening test suite against your live Neon PostgreSQL database:
```bash
cd server
bun run test-campaign-sync.ts
```

This verifies:
1. Process health & Neon database readiness.
2. UUID validation returning `400 INVALID_CAMPAIGN_ID`.
3. 5-step campaign creation using **ONE server UUID**.
4. Database completeness validation (optional cover image, sources >= 1, reach >= 1, $100 min goal).
5. Neon database inspection confirming **exactly ONE row** per campaign.
6. True revision workflow with zero duplicate rows.
7. Lifecycle state enforcement (modifications forbidden once in `FUNDING` status).
8. Real SQL `ending_soon` sort query execution.

---

## 📋 Available Commands (Bun Only)

```bash
bun expo start                  # Start Metro bundler
bunx tsc --noEmit               # Mobile TypeScript check
cd server && bun run typecheck  # Server TypeScript check
bun run db:migrate              # Run Drizzle migrations
bun run db:studio               # Launch Drizzle Studio (https://local.drizzle.studio)
bun run db:seed                 # Populate idempotent demo data
bun run server                  # Start backend dev server
cd server && bun run test-campaign-sync.ts # Run end-to-end sync verification
```

---

## 🌐 Backend API Endpoints

### Public Endpoints
- `GET  /api/v1/health` - Process health check
- `GET  /api/v1/ready` - Database connectivity probe (`SELECT 1`)
- `GET  /api/v1/campaigns` - List public campaigns (with `search`, `sort`, `category`, pagination; only active public states)
- `GET  /api/v1/campaigns/:id` - Public campaign detail (UUID validated, returns `INVALID_CAMPAIGN_ID` on malformed IDs)

### Creator Endpoints (Development Demo Identity: `creator@campaignamplify.org`)
- `GET  /api/v1/me/campaigns` - List all campaigns owned by creator (all lifecycle states: `DRAFT` through `COMPLETED`)
- `GET  /api/v1/me/campaigns/:id` - Full creator campaign detail (including review feedback, rejection reasons, and complete status history)
- `POST /api/v1/campaigns` - Create initial campaign draft (`status: DRAFT`, returns server UUID, logs initial history)
- `PATCH /api/v1/campaigns/:id/basics` - Step 1: Basics (validates category against allowed constants)
- `PATCH /api/v1/campaigns/:id/story` - Step 2: Narrative & sources (atomic transaction)
- `PATCH /api/v1/campaigns/:id/visuals` - Step 3: Social ad creative (upsert)
- `PATCH /api/v1/campaigns/:id/reach` - Step 4: Audience targeting (upsert) & duration sync
- `POST /api/v1/campaigns/:id/submit` - Step 5: Completeness validation (headline, intro, story, min 1 source) & transition to `SUBMITTED_FOR_REVIEW`

### Reviewer & Moderation Endpoints (Demo Reviewer Identity: `reviewer@campaignamplify.org`)
- `GET  /api/v1/review/campaigns` - Reviewer queue (`SUBMITTED_FOR_REVIEW`, `UNDER_REVIEW`, `CHANGES_REQUESTED`, `APPROVED`)
- `GET  /api/v1/review/campaigns/:id` - Full campaign inspection for editorial reviewers (including citation audit)
- `POST /api/v1/review/campaigns/:id/start` - Assign reviewer and begin verification (`UNDER_REVIEW`)
- `POST /api/v1/review/campaigns/:id/request-changes` - Request creator revisions (`CHANGES_REQUESTED`, stores feedback)
- `POST /api/v1/review/campaigns/:id/approve` - Approve campaign (`APPROVED`, stages for funding launch)
- `POST /api/v1/review/campaigns/:id/reject` - Reject campaign with reason (`REJECTED`)
- `POST /api/v1/review/campaigns/:id/start-funding` - Publish campaign to live community funding (`FUNDING`, opens backer contributions)

---

## 🚦 Server Lifecycle State Machine

Campaign lifecycle authority is enforced strictly by PostgreSQL transactions:

```
DRAFT
  ↓ (Creator Submit)
SUBMITTED_FOR_REVIEW
  ↓ (Reviewer Start)
UNDER_REVIEW
  ├──→ (Reviewer Request Changes) → CHANGES_REQUESTED
  │                                     ↓ (Creator Resubmit same UUID)
  │                                   SUBMITTED_FOR_REVIEW
  │                                     ↓ (Reviewer Start round 2)
  │                                   UNDER_REVIEW
  ├──→ (Reviewer Approve) → APPROVED
  │                           ↓ (Start Funding)
  │                         FUNDING (Public & Backable)
  │                           ├──→ FUNDING_GOAL_REACHED → DISTRIBUTION_PREPARATION → PROMOTING → COMPLETED
  │                           └──→ FUNDING_ENDED        → REFUND_PENDING / DISTRIBUTION_PREPARATION
  └──→ (Reviewer Reject)  → REJECTED
```

---

---

## 🔐 Real Authentication & Role-Based Access Control (RBAC)

Campaign Amplify features JWT-based authentication and three roles: `USER`, `REVIEWER`, and `ADMIN`.

```
Mobile Sign In / Register
    ↓
JWT Signed on Server (HS256)
    ↓
expo-secure-store ('campaign_amplify_access_token')
    ↓
Axios Request Interceptor (Authorization: Bearer <token>)
    ↓
Express authenticateUser Middleware
    ↓
req.user = { id, email, role }
```

### 1. User Roles Matrix
- **`USER`**: Can create campaigns, edit own drafts, submit own campaigns, view own Creator Dashboard, back funding campaigns, view own contributions, and download demo receipts. Cannot access reviewer routes.
- **`REVIEWER`**: Inherits all USER capabilities, plus access to the Reviewer Queue (`/api/v1/review/*`), starting editorial reviews, requesting revisions, approving/rejecting campaigns, and launching live funding.
- **`ADMIN`**: Full platform authority including all reviewer operations and administrative oversight.

### 2. Password Security & Cryptography
- Passwords are securely hashed with `bcryptjs` (salt rounds: 10). Plaintext passwords are never stored, logged, or serialized.
- Token signing uses server-only environment variables (`JWT_SECRET`, `JWT_EXPIRES_IN`). Secrets are never bundled into the Expo mobile bundle.
- Mobile client persists JWTs exclusively in hardware-backed `expo-secure-store` (never in `AsyncStorage`).

### 3. Seed Demo Accounts
Run `bun run db:seed` in `server/` to provision idempotent test accounts:
| Role | Email | Password | Intended Use |
| :--- | :--- | :--- | :--- |
| **USER** | `creator@campaignamplify.org` | `Password123!` | Create & edit own campaigns, back funding campaigns |
| **REVIEWER** | `reviewer@campaignamplify.org` | `Password123!` | Moderate queue, request revisions, approve, launch funding |
| **ADMIN** | `admin@campaignamplify.org` | `AdminPassword123!` | Platform administration and editorial oversight |

---

## 🛡️ Financial Integrity & Idempotency Architecture

Contributions and payment processing are hardened against race conditions and concurrent double-charging:

### 1. Atomic Conditional Confirmation
During payment simulation, contribution status is updated using atomic SQL:
```sql
UPDATE contributions
SET status = 'CONFIRMED', confirmed_at = NOW(), updated_at = NOW()
WHERE id = :contributionId AND status = 'PENDING'
RETURNING *;
```
If two simultaneous `SUCCESS` requests arrive for the same contribution:
- Exactly **one** transaction matches `status = 'PENDING'` and receives the returned row.
- That winning transaction increments `campaign.amountRaised` and `campaign.backerCount`.
- The losing transaction receives **0 rows**, loads the current state, observes `status = 'CONFIRMED'`, and returns the existing confirmed result **idempotently** without incrementing campaign funds.

### 2. Database-Level Unique Invariants
- **One Success Per Contribution**: A PostgreSQL partial unique index prevents application logic regression:
  ```sql
  CREATE UNIQUE INDEX payments_one_success_idx ON payments(contribution_id) WHERE status = 'SUCCESS';
  ```
- **Unique Provider Reference**: `payments.provider_reference` is strictly unique with automated collision retry.

### 3. Contribution Cancellation
- `POST /api/v1/me/contributions/:id/cancel` enables users to explicitly abandon pending checkouts. Transitions `PENDING` → `CANCELLED` without altering campaign funds.

---

## 🧪 Automated Testing & Verification

Run the end-to-end test suites against your live Neon PostgreSQL database:

### 1. Real JWT Auth & RBAC Suite
```bash
cd server
bun run test:auth
```
Verifies 16 authentication invariants: registration, duplicate email rejection (409), invalid credentials (401), login token acquisition, `/auth/me` profile validation, malformed token rejection, USER access blocked from reviewer queue (403), REVIEWER access granted (200), non-owner edit rejection (403), owner edit authorized (200), payment ownership validation, and receipt ownership protection.

### 2. Financial Integrity & Concurrent Idempotency Suite
```bash
cd server
bun run test:idempotency
```
Simultaneously fires two concurrent `SUCCESS` payment simulations on the same pending contribution near its funding goal. Asserts that `amountRaised` increments exactly once, `backerCount` increments once, exactly one `SUCCESS` payment row exists, and the `FUNDING_GOAL_REACHED` lifecycle transition triggers once.

### 3. Step Sync Hardening Suite
```bash
cd server
bun run test:sync
```

### 4. Full Review & Lifecycle Suite
```bash
cd server
bun run test:lifecycle
```

### 5. Contribution & Payment Lifecycle Suite
```bash
cd server
bun run test:contribution
```

---

## 📋 Available Commands (Bun Only)

```bash
bun expo start                  # Start Metro bundler
bunx tsc --noEmit               # Mobile TypeScript check
cd server && bun run typecheck  # Server TypeScript check
cd server && bun run test:auth  # Run auth & RBAC integration test
cd server && bun run test:idempotency # Run financial idempotency test
cd server && bun run test:sync  # Run campaign step sync test
cd server && bun run test:lifecycle # Run review lifecycle test
cd server && bun run test:contribution # Run contribution lifecycle test
bun run db:migrate              # Run Drizzle migrations
bun run db:studio               # Launch Drizzle Studio (https://local.drizzle.studio)
bun run db:seed                 # Populate idempotent demo data
bun run server                  # Start backend dev server
```

